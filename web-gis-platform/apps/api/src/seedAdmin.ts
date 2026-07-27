import bcrypt from 'bcryptjs';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis?schema=public'
});
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  try {
    const adminEmail = 'admin@saolatek.vn';
    const rawPassword = 'admin123password';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Tài khoản Admin đã tồn tại trong CSDL:');
      console.log(`- Email: ${existingAdmin.email}`);
      console.log(`- Role: ${existingAdmin.role}`);
      console.log(`- FullName: ${existingAdmin.fullName}`);
    } else {
      const hashedPassword = await bcrypt.hash(rawPassword, 12);
      const newAdmin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          fullName: 'SAOLATEK Administrator',
          role: 'SUPERADMIN'
        }
      });
      console.log('🎉 Đã khởi tạo thành công tài khoản Admin mặc định:');
      console.log(`- Email: ${newAdmin.email}`);
      console.log(`- Password: ${rawPassword}`);
      console.log(`- Role: ${newAdmin.role}`);
    }

    // List all users in database
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, createdAt: true }
    });
    console.log('\n📋 Danh sách tất cả tài khoản trong hệ thống:', allUsers);

  } catch (err: any) {
    console.error('❌ Lỗi khi seed admin:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
