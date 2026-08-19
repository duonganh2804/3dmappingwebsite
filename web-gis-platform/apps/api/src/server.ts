import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { register, login, googleLogin, refresh, logout, me, forgotPassword, resetPassword } from './controllers/authController';
import { getProjectMembers, addProjectMember, updateProjectMemberRole, removeProjectMember } from './controllers/memberController';
import { authenticateToken, optionalAuth, requireProjectRole, AuthRequest } from './middlewares/authMiddleware';
import { translateTileset } from './utils/translator';
import { parseAndUnifyCoordinates } from './utils/coordinateConverter';
import { uploadProjectFilesToR2 } from './r2Service';
import { sendLeadNotificationEmail } from './utils/emailService';
import { spawn } from 'child_process';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const app = express();
const PORT = process.env.PORT || 7860;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis?schema=public'
});
const prisma = new PrismaClient({ adapter });

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Rate Limiter cho API Auth
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // Tối đa 20 yêu cầu / IP trong 15 phút
  message: { success: false, message: 'Thao tác quá nhiều lần. Vui lòng thử lại sau 15 phút.' }
});

// ── 1. AUTHENTICATION ROUTES ──
app.post('/api/auth/register', authRateLimiter, register);
app.post('/api/auth/login', authRateLimiter, login);
app.post('/api/auth/google', authRateLimiter, googleLogin);
app.post('/api/auth/refresh', refresh);
app.post('/api/auth/logout', logout);
app.post('/api/auth/forgot-password', authRateLimiter, forgotPassword);
app.post('/api/auth/reset-password', authRateLimiter, resetPassword);
app.get('/api/auth/me', authenticateToken, me);

// ── 2. PROJECT MEMBER & PERMISSION ROUTES ──
app.get('/api/projects/:id/members', authenticateToken, requireProjectRole('VIEWER'), getProjectMembers);
app.post('/api/projects/:id/members', authenticateToken, requireProjectRole('OWNER'), addProjectMember);
app.patch('/api/projects/:id/members/:userId', authenticateToken, requireProjectRole('OWNER'), updateProjectMemberRole);
app.delete('/api/projects/:id/members/:userId', authenticateToken, requireProjectRole('OWNER'), removeProjectMember);

// ─── Pipeline State ────────────────────────────────────────────────────────
// Tracking trạng thái xử lý ngầm để frontend biết được tiến độ
let processLogs: string[] = [];
let pipelineState: {
  isProcessing: boolean;
  projectId: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  success: boolean | null;
} = {
  isProcessing: false,
  projectId: null,
  startedAt: null,
  finishedAt: null,
  success: null
};

// API lấy logs + trạng thái pipeline (polling từ frontend)
app.get('/api/logs', (req, res) => {
  res.json({ logs: processLogs, pipeline: pipelineState });
});

// API lấy chỉ trạng thái (nhẹ hơn, không cần toàn bộ logs)
app.get('/api/logs/status', (req, res) => {
  res.json({ pipeline: pipelineState });
});

// API xóa logs
app.post('/api/logs/clear', (req, res) => {
  processLogs = [];
  pipelineState = { isProcessing: false, projectId: null, startedAt: null, finishedAt: null, success: null };
  res.json({ success: true });
});

// API nén và tối ưu hóa hàng loạt thư mục thông qua build.py
app.post('/api/optimize/batch', authenticateToken, async (req: AuthRequest, res) => {
  const { inputDir, outputDir, projectId, epsg } = req.body;

  if (!inputDir) {
    return res.status(400).json({ error: 'Thiếu đường dẫn thư mục gốc inputDir' });
  }

  const resolvedInput = path.resolve(inputDir);
  const resolvedOutput = outputDir 
    ? path.resolve(outputDir)
    : path.resolve(inputDir + '_Processed');

  processLogs = [];
  pipelineState = {
    isProcessing: true,
    projectId: projectId || null,
    startedAt: Date.now(),
    finishedAt: null,
    success: null
  };
  processLogs.push(`🚀 Bắt đầu gọi Python build.py xử lý thư mục: ${resolvedInput}`);
  if (projectId) {
    processLogs.push(`📌 Dự án mục tiêu: ${projectId}`);
  }

  // Ưu tiên biến môi trường PYTHON_CMD (dùng khi chạy Docker/Linux/CI)
  let pythonCmd = process.env.PYTHON_CMD || '';

  if (!pythonCmd) {
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      const userProfile = process.env.USERPROFILE || 'C:\\Users\\duong';
      const localPython312 = path.join(userProfile, 'AppData\\Local\\Programs\\Python\\Python312\\python.exe');
      
      if (fs.existsSync(localPython312)) {
        pythonCmd = localPython312;
      } else if (fs.existsSync('C:\\Python312\\python.exe')) {
        pythonCmd = 'C:\\Python312\\python.exe';
      } else if (fs.existsSync('C:\\Python314\\python.exe')) {
        pythonCmd = 'C:\\Python314\\python.exe';
      } else {
        pythonCmd = 'python';
      }
    } else {
      // Linux/macOS/Docker: dùng python3 mặc định
      pythonCmd = 'python3';
    }
  }

  processLogs.push(`🐍 Sử dụng Python: ${pythonCmd}`);

  const pythonProcess = spawn(pythonCmd, [
    '-u',
    'tools/3d-optimizer/src/build_optimized.py',
    resolvedInput,
    '-o',
    resolvedOutput,
    '--epsg', String(epsg || 32648)
  ], { cwd: path.resolve(__dirname, '../../..') });

  pythonProcess.stdout.on('data', (data) => {
    const text = data.toString('utf-8');
    text.split('\n').forEach((line: string) => {
      if (line.trim()) processLogs.push(line.trim());
    });
  });

  pythonProcess.stderr.on('data', (data) => {
    const text = data.toString('utf-8');
    text.split('\n').forEach((line: string) => {
      if (line.trim()) processLogs.push(`[ERROR] ${line.trim()}`);
    });
  });

  pythonProcess.on('close', async (code) => {
    if (code !== 0) {
      processLogs.push(`❌ Lỗi: Tiến trình build.py thất bại với mã lỗi (Exit code: ${code}).`);
      pipelineState.isProcessing = false;
      pipelineState.finishedAt = Date.now();
      pipelineState.success = false;
      if (projectId) {
        processLogs.push(`🗑️ Đang dọn dẹp và xóa dự án lỗi khỏi cơ sở dữ liệu (ID: ${projectId})...`);
        try {
          await prisma.project.delete({ where: { id: projectId } });
          processLogs.push(`✅ Đã xóa dự án lỗi thành công để tránh làm nhiễm bẩn dữ liệu.`);
        } catch (delErr: any) {
          processLogs.push(`⚠️ Không thể tự động xóa dự án khỏi DB: ${delErr.message}`);
        }
      }
      return;
    }

    processLogs.push(`🎉 Hoàn tất toàn bộ tiến trình xử lý thư mục! (Exit code: ${code})`);
    
    if (projectId) {
      processLogs.push(`☁️ Bắt đầu upload lên Cloudflare R2 cho project: ${projectId}`);
      try {
        const urls = await uploadProjectFilesToR2(projectId, resolvedOutput);
        processLogs.push(`✅ Upload R2 thành công! URLs: ${JSON.stringify(urls)}`);

        const metaPath = path.join(resolvedOutput, 'dom/metadata.json');
        let centerLon = 106.8099;
        let centerLat = 10.8404;
        let epsgNum = 32648;

        if (await fs.pathExists(metaPath)) {
          try {
            const meta = await fs.readJson(metaPath);
            centerLon = meta.centerLon || (meta.center && meta.center[0]) || centerLon;
            centerLat = meta.centerLat || (meta.center && meta.center[1]) || centerLat;
            epsgNum = meta.epsg || epsg || epsgNum;
            processLogs.push(`📍 Đọc tọa độ trung tâm thành công: Lon=${centerLon}, Lat=${centerLat}`);
          } catch (metaErr: any) {
            processLogs.push(`⚠️ Cảnh báo: Lỗi đọc file metadata.json: ${metaErr.message}`);
          }
        }

        await prisma.project.update({
          where: { id: projectId },
          data: {
            domUrl: urls.domUrl || null,
            modelUrl: urls.modelUrl || null,
            metadataUrl: urls.metadataUrl || null,
            pointCloudId: urls.pointCloudUrl || null,
            centerLon,
            centerLat,
            epsg: epsgNum
          }
        });
        processLogs.push(`💾 Đã đồng bộ thành công URLs và tọa độ dự án vào Database!`);
        processLogs.push(`__PIPELINE_DONE__`);
        pipelineState.isProcessing = false;
        pipelineState.finishedAt = Date.now();
        pipelineState.success = true;
      } catch (err: any) {
        processLogs.push(`❌ Lỗi đồng bộ dữ liệu lên Cloud: ${err.message}`);
        processLogs.push(`__PIPELINE_DONE__`);
        pipelineState.isProcessing = false;
        pipelineState.finishedAt = Date.now();
        pipelineState.success = false;
      }
    } else {
      processLogs.push(`__PIPELINE_DONE__`);
      pipelineState.isProcessing = false;
      pipelineState.finishedAt = Date.now();
      pipelineState.success = true;
    }
  });

  res.json({ success: true, message: 'Tiến trình build.py đã được kích hoạt ngầm.', projectId });
});

// API chỉ upload file lên R2 + cập nhật DB
app.post('/api/upload-only', authenticateToken, async (req: AuthRequest, res) => {
  const { projectId, outputDir } = req.body;
  if (!projectId || !outputDir) {
    return res.status(400).json({ error: 'Thiếu projectId hoặc outputDir' });
  }

  const resolvedOutput = path.resolve(outputDir);
  res.json({ success: true, message: 'Bắt đầu upload lên R2...' });

  (async () => {
    try {
      processLogs.push(`☁️ [upload-only] Bắt đầu upload R2 cho project: ${projectId}`);
      const urls = await uploadProjectFilesToR2(projectId, resolvedOutput);
      processLogs.push(`✅ [upload-only] Upload R2 thành công: ${JSON.stringify(urls)}`);

      const metaPath = path.join(resolvedOutput, 'dom/metadata.json');
      const updateData: any = {};
      if (urls.domUrl) updateData.domUrl = urls.domUrl;
      if (urls.modelUrl) updateData.modelUrl = urls.modelUrl;
      if (urls.metadataUrl) updateData.metadataUrl = urls.metadataUrl;
      if (urls.pointCloudUrl) updateData.pointCloudId = urls.pointCloudUrl;

      if (await fs.pathExists(metaPath)) {
        const meta = await fs.readJson(metaPath);
        if (meta.centerLon) updateData.centerLon = meta.centerLon;
        if (meta.centerLat) updateData.centerLat = meta.centerLat;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.project.update({ where: { id: projectId }, data: updateData });
        processLogs.push(`💾 [upload-only] Cập nhật DB thành công: ${JSON.stringify(updateData)}`);
      }
    } catch (err: any) {
      processLogs.push(`❌ [upload-only] Lỗi: ${err.message}`);
    }
  })();
});

// API dịch chuyển ma trận 3D Tiles
app.post('/api/optimize/translate', authenticateToken, async (req, res) => {
  const { tilesetPath, x, y, z } = req.body;

  if (!tilesetPath) {
    return res.status(400).json({ error: 'Thiếu đường dẫn file tileset.json' });
  }

  const resolvedPath = path.resolve(tilesetPath);

  try {
    await translateTileset(resolvedPath, parseFloat(x || 0), parseFloat(y || 0), parseFloat(z || 0));
    res.json({ success: true, message: 'Đã dịch chuyển ma trận thành công!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API lấy danh sách dự án (Lọc theo Công khai hoặc Thành viên)
app.get('/api/projects', optionalAuth, async (req: AuthRequest, res) => {
  try {
    let whereCondition: any = { isPublic: true };

    if (req.user) {
      if (req.user.role === 'SUPERADMIN') {
        whereCondition = {}; // Superadmin thấy tất cả dự án
      } else {
        whereCondition = {
          OR: [
            { isPublic: true },
            { createdById: req.user.id },
            { members: { some: { userId: req.user.id } } }
          ]
        };
      }
    }

    const projects = await prisma.project.findMany({
      where: whereCondition,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, fullName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API lấy chi tiết 1 dự án
app.get('/api/projects/:id', optionalAuth, requireProjectRole('VIEWER'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, fullName: true, avatarUrl: true } }
          }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API tạo dự án mới
app.post('/api/projects', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, centerLon, centerLat, epsg, domUrl, metadataUrl, modelUrl, pointCloudId, isPublic } = req.body;
    
    let finalLon = parseFloat(centerLon) || 0;
    let finalLat = parseFloat(centerLat) || 0;
    const epsgNum = parseInt(epsg, 10) || 32648;

    if (finalLon !== 0 || finalLat !== 0) {
      const unified = parseAndUnifyCoordinates(finalLon, finalLat, epsgNum);
      finalLon = unified.lon;
      finalLat = unified.lat;
      console.log(`[API Coordinate Unification] Original: [${centerLon}, ${centerLat}] -> Unified WGS84: [${finalLon}, ${finalLat}] (Converted: ${unified.isConverted})`);
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        centerLon: finalLon,
        centerLat: finalLat,
        epsg: epsgNum,
        domUrl,
        metadataUrl,
        modelUrl,
        pointCloudId,
        isPublic: Boolean(isPublic),
        createdById: req.user?.id,
        members: req.user?.id ? {
          create: {
            userId: req.user.id,
            role: 'OWNER'
          }
        } : undefined
      }
    });
    res.status(201).json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// API cập nhật dự án
app.put('/api/projects/:id', authenticateToken, requireProjectRole('EDITOR'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const data = { ...req.body };

    if (data.centerLon !== undefined || data.centerLat !== undefined) {
      const existingProject = await prisma.project.findUnique({ where: { id } });
      if (existingProject) {
        const currentEpsg = data.epsg !== undefined ? (parseInt(data.epsg, 10) || 32648) : existingProject.epsg;
        let lon = parseFloat(data.centerLon) || existingProject.centerLon;
        let lat = parseFloat(data.centerLat) || existingProject.centerLat;

        if (lon !== 0 || lat !== 0) {
          const unified = parseAndUnifyCoordinates(lon, lat, currentEpsg);
          data.centerLon = unified.lon;
          data.centerLat = unified.lat;
          console.log(`[API Coordinate Unification Update] Original: [${lon}, ${lat}] -> Unified WGS84: [${data.centerLon}, ${data.centerLat}]`);
        }
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data
    });
    res.json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// API xóa dự án
// ── 3. DEMO LEADS & CONTACT SALES ROUTES ──

// Trạng thái Demo access của user hiện tại.
// Flow mới:
// - Demo Showcase là các project public.
// - User đã gửi Book Demo ít nhất một lần => có Demo access.
// - Không còn phụ thuộc DEMO_PROJECT_ID / ProjectMember.
app.get('/api/demo-access', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'SUPERADMIN') {
      return res.json({ success: true, hasAccess: true });
    }

    const accountEmail = req.user!.email.trim().toLowerCase();

    const existingLead = await prisma.demoLead.findFirst({
      where: {
        email: accountEmail
      },
      select: { id: true }
    });

    res.json({
      success: true,
      hasAccess: Boolean(existingLead)
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      hasAccess: false,
      message: error.message
    });
  }
});

// Gửi yêu cầu Demo.
// Sau khi đăng ký thành công frontend sẽ chuyển về /dashboard,
// nơi user tự chọn một trong các project Demo Showcase (isPublic = true).
app.post('/api/demo-leads', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { fullName, jobTitle, company, phone, message, source } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        error: 'Vui lòng cung cấp Nội dung yêu cầu'
      });
    }

    const accountEmail = req.user!.email.trim().toLowerCase();

    // Nếu user đã đăng ký Demo trước đó thì không tạo lead trùng.
    const existingLead = await prisma.demoLead.findFirst({
      where: { email: accountEmail }
    });

    if (existingLead) {
      return res.json({
        success: true,
        hasAccess: true,
        message: 'Bạn đã đăng ký Demo trước đó.',
        lead: existingLead
      });
    }

    const lead = await prisma.demoLead.create({
      data: {
        email: accountEmail,
        fullName: fullName || req.user?.fullName || null,
        jobTitle: jobTitle || null,
        company: company || null,
        phone: phone || null,
        message: String(message).trim(),
        source: source || null,
        status: 'NEW'
      }
    });

    // Gửi Email thông báo trực tiếp đến email công ty.
    sendLeadNotificationEmail({
      email: accountEmail,
      fullName: fullName || req.user?.fullName,
      jobTitle,
      company,
      phone,
      message: String(message).trim(),
      source
    }).catch(err => console.error('[Background Email Error]:', err));

    res.status(201).json({
      success: true,
      hasAccess: true,
      message: 'Đăng ký Demo thành công.',
      lead
    });
  } catch (error: any) {
    console.error('Lỗi lưu Yêu cầu Demo:', error);
    res.status(500).json({
      success: false,
      hasAccess: false,
      error: error.message || 'Lỗi xử lý yêu cầu Demo'
    });
  }
});

// API Admin lấy danh sách các Yêu Cầu Demo (Chỉ SuperAdmin)
app.get('/api/admin/demo-leads', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền xem danh sách yêu cầu Demo' });
    }

    const leads = await prisma.demoLead.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Admin cập nhật trạng thái Yêu cầu Demo (NEW | CONTACTED | CLOSED)
app.patch('/api/admin/demo-leads/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền cập nhật' });
    }

    const id = req.params.id as string;
    const { status } = req.body;

    const updated = await prisma.demoLead.update({
      where: { id },
      data: { status }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// API Admin xóa Yêu cầu Demo
app.delete('/api/admin/demo-leads/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền xóa' });
    }

    const id = req.params.id as string;
    await prisma.demoLead.delete({ where: { id } });

    res.json({ success: true, message: 'Đã xóa yêu cầu demo' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[API Server] Đang chạy tại http://localhost:${PORT}`);
});
