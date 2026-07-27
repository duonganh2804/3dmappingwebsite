import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'webgis-super-secret-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'webgis-refresh-secret-key-2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '823274663266-i5200soh3p8f83k6a9nekrj8cnc3aen0.apps.googleusercontent.com';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis'
});
const prisma = new PrismaClient({ adapter });

// 0. Đăng Nhập / Đăng Ký Tự Động Bằng Google OAuth 2.0
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Thiếu Google Token.' });
    }

    // Xác thực idToken trực tiếp với Google Security Server
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Xác thực tài khoản Google không hợp lệ.' });
    }

    const { sub: googleId, email, name: fullName, picture: avatarUrl } = payload;

    // Tìm hoặc khởi tạo tài khoản người dùng trong CSDL
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          fullName: fullName || email.split('@')[0],
          avatarUrl,
          role: 'USER'
        }
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatarUrl: avatarUrl || user.avatarUrl }
      });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Đăng nhập Google thành công!',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err: any) {
    console.error('Lỗi Google Auth:', err);
    res.status(500).json({ success: false, message: 'Không thể đăng nhập bằng Google: ' + err.message });
  }
};

// 1. Đăng ký Tài Khoản Mới
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Email, Mật khẩu và Họ tên.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có tối thiểu 6 ký tự.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký trên hệ thống.' });
    }

    // Hash mật khẩu với Bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });

    // Tạo Access Token & Refresh Token
    const accessToken = jwt.sign(
      { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: newUser.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Gửi RefreshToken vào Cookie HTTP-Only an toàn
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      accessToken,
      user: newUser
    });
  } catch (err: any) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng ký tài khoản.' });
  }
};

// 2. Đăng Nhập Hệ Thống
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Email và Mật khẩu.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err: any) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập.' });
  }
};

// 3. Làm Mới Access Token (Refresh Token)
export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy phiên làm việc.' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    res.status(403).json({ success: false, message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' });
  }
};

// 4. Đăng Xuất
export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Đã đăng xuất khỏi hệ thống.' });
};

// 5. Lấy Thông Tin Cá Nhân Hạt Nhân (/api/auth/me)
export const me = async (req: any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi đọc thông tin tài khoản.' });
  }
};
