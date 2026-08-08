import 'dotenv/config';
import { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AuthRequest } from '../middlewares/authMiddleware';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis'
});
const prisma = new PrismaClient({ adapter });

// 1. Lấy danh sách thành viên dự án
export const getProjectMembers = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id as string;

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.json({ success: true, members });
  } catch (err: any) {
    console.error('Lỗi lấy danh sách thành viên dự án:', err);
    res.status(500).json({ success: false, message: 'Không thể lấy danh sách thành viên.' });
  }
};

// 2. Thêm / Mời thành viên vào dự án theo Email
export const addProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const { email, role } = req.body; // role: 'OWNER' | 'EDITOR' | 'VIEWER'

    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp Email và Quyền hạn (OWNER/EDITOR/VIEWER).' });
    }

    // Tìm người dùng theo Email
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng với Email này.' });
    }

    // Kiểm tra xem người dùng đã ở trong dự án chưa
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ success: false, message: 'Người dùng này đã là thành viên của dự án.' });
    }

    // Tạo bản ghi thành viên mới
    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: role as 'OWNER' | 'EDITOR' | 'VIEWER'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Đã phân quyền ${role} cho thành viên ${targetUser.fullName} (${targetUser.email}).`,
      member: newMember
    });
  } catch (err: any) {
    console.error('Lỗi thêm thành viên dự án:', err);
    res.status(500).json({ success: false, message: 'Không thể thêm thành viên vào dự án.' });
  }
};

// 3. Cập nhật cấp quyền của thành viên trong dự án
export const updateProjectMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const userId = req.params.userId as string;
    const { role } = req.body; // 'OWNER' | 'EDITOR' | 'VIEWER'

    if (!role) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp cấp quyền mới.' });
    }

    const updatedMember = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      },
      data: { role },
      include: {
        user: {
          select: { id: true, email: true, fullName: true }
        }
      }
    });

    res.json({
      success: true,
      message: `Đã cập nhật quyền thành viên thành ${role}.`,
      member: updatedMember
    });
  } catch (err: any) {
    console.error('Lỗi cập nhật quyền thành viên:', err);
    res.status(500).json({ success: false, message: 'Không thể cập nhật quyền thành viên.' });
  }
};

// 4. Xóa thành viên khỏi dự án
export const removeProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const userId = req.params.userId as string;

    // Không cho phép tự xóa chính mình nếu là Owner duy nhất (xử lý phía FE hoặc check count)
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId
        }
      }
    });

    res.json({ success: true, message: 'Đã xóa thành viên khỏi dự án.' });
  } catch (err: any) {
    console.error('Lỗi xóa thành viên khỏi dự án:', err);
    res.status(500).json({ success: false, message: 'Không thể xóa thành viên khỏi dự án.' });
  }
};
