import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { register, login, googleLogin, refresh, logout, me } from './controllers/authController';
import { getProjectMembers, addProjectMember, updateProjectMemberRole, removeProjectMember } from './controllers/memberController';
import { authenticateToken, optionalAuth, requireProjectRole, AuthRequest } from './middlewares/authMiddleware';
import { translateTileset } from '../../../tools/3d-optimizer/src/translator';
import { uploadProjectFilesToR2 } from './r2Service';
import { spawn } from 'child_process';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const app = express();
const PORT = 3000;

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
app.get('/api/auth/me', authenticateToken, me);

// ── 2. PROJECT MEMBER & PERMISSION ROUTES ──
app.get('/api/projects/:id/members', authenticateToken, requireProjectRole('VIEWER'), getProjectMembers);
app.post('/api/projects/:id/members', authenticateToken, requireProjectRole('OWNER'), addProjectMember);
app.patch('/api/projects/:id/members/:userId', authenticateToken, requireProjectRole('OWNER'), updateProjectMemberRole);
app.delete('/api/projects/:id/members/:userId', authenticateToken, requireProjectRole('OWNER'), removeProjectMember);

// Lưu trữ log tiến trình tạm thời để trả về cho Frontend hiển thị thời gian thực
let processLogs: string[] = [];

// Ghi đè console.log của compressor để bắn sang frontend
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  const message = args.join(' ');
  processLogs.push(`[INFO] ${message}`);
  originalLog.apply(console, args);
};

console.error = (...args) => {
  const message = args.join(' ');
  processLogs.push(`[ERROR] ${message}`);
  originalError.apply(console, args);
};

// API lấy logs
app.get('/api/logs', (req, res) => {
  res.json({ logs: processLogs });
});

// API xóa logs
app.post('/api/logs/clear', (req, res) => {
  processLogs = [];
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
  processLogs.push(`🚀 Bắt đầu gọi Python build.py xử lý thư mục: ${resolvedInput}`);
  if (projectId) {
    processLogs.push(`📌 Dự án mục tiêu: ${projectId}`);
  }

  const pythonProcess = spawn('python3.12', [
    '-u',
    'tools/3d-optimizer/src/build_optimized.py',
    resolvedInput,
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
      } catch (err: any) {
        processLogs.push(`❌ Lỗi đồng bộ dữ liệu lên Cloud: ${err.message}`);
      }
    }
  });

  res.json({ success: true, message: 'Tiến trình build.py đã được kích hoạt ngầm.' });
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
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
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
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        centerLon,
        centerLat,
        epsg: epsg || 32648,
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
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// API xóa dự án
app.delete('/api/projects/:id', authenticateToken, requireProjectRole('OWNER'), async (req: AuthRequest, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Đã xóa dự án' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[API Server] Đang chạy tại http://localhost:${PORT}`);
});
