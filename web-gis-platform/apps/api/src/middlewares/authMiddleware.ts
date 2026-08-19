import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const JWT_SECRET = process.env.JWT_SECRET || 'webgis-super-secret-key-2026';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis'
});
const prisma = new PrismaClient({ adapter });

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPERADMIN' | 'USER';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// 1. Middleware bắt buộc Đăng nhập (Authenticate Token)
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies?.accessToken;

  const jwtToken = token || cookieToken;

  if (!jwtToken) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập tài nguyên này.' });
  }

  try {
    const decoded = jwt.verify(jwtToken, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// 2. Middleware xác thực Tùy chọn (Optional Auth for Public Projects)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies?.accessToken;

  const jwtToken = token || cookieToken;

  if (jwtToken) {
    try {
      const decoded = jwt.verify(jwtToken, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch (err) {
      // Ignore token decode errors for optional auth
    }
  }

  next();
};

// Thứ tự ưu tiên cấp quyền dự án
const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1
};

// 3. Middleware Kiểm soát Quyền Truy Cập Dự Án (Per-Project RBAC)
export const requireProjectRole = (requiredRole: 'OWNER' | 'EDITOR' | 'VIEWER') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.id || req.params.projectId || req.body.projectId;

      if (!projectId) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy ID dự án.' });
      }

      // Đọc thông tin dự án
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true }
      });

      if (!project) {
        return res.status(404).json({ success: false, message: 'Dự án không tồn tại.' });
      }

      // Quyền SUPERADMIN hệ thống có toàn quyền
      if (req.user && req.user.role === 'SUPERADMIN') {
        return next();
      }

      // Project công khai (Demo Showcase) được phép xem với quyền VIEWER.
      if (project.isPublic && requiredRole === 'VIEWER') {
        return next();
      }

      // Yêu cầu đăng nhập nếu dự án riêng tư hoặc yêu cầu quyền sửa/xóa.
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập để truy cập dự án này.'
        });
      }

      // Project legacy/global chưa có chủ sở hữu vẫn cho phép thao tác như logic cũ.
      if (!project.createdById) {
        return next();
      }

      // Nếu là người tạo dự án (createdBy) -> Tự động có quyền OWNER
      if (project.createdById === req.user.id) {
        return next();
      }

      // Tìm thông tin phân quyền thành viên trong dự án
      const member = project.members.find(m => m.userId === req.user?.id);

      if (!member) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập vào dự án này.'
        });
      }

      const userRoleLevel = ROLE_HIERARCHY[member.role] || 0;
      const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          message: `Thao tác yêu cầu quyền tối thiểu là ${requiredRole}. Quyền hiện tại của bạn: ${member.role}.`
        });
      }

      next();
    } catch (err: any) {
      console.error('Lỗi khi kiểm tra phân quyền dự án:', err);
      res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra quyền hệ thống.'
      });
    }
  };
};