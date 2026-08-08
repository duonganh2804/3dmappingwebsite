import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrateData() {
  console.log('🔄 Đang khởi tạo các kết nối database...');

  const localConnectionString = 'postgresql://postgres:postgres@127.0.0.1:5432/webgis?schema=public';
  const supabaseConnectionString = 'postgresql://postgres.gcqdxfhzktwmbuilipau:Duonganh280403@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

  const localPool = new pg.Pool({ connectionString: localConnectionString });
  const localAdapter = new PrismaPg(localPool);
  const localPrisma = new PrismaClient({ adapter: localAdapter });

  const supabasePool = new pg.Pool({ connectionString: supabaseConnectionString });
  const supabaseAdapter = new PrismaPg(supabasePool);
  const supabasePrisma = new PrismaClient({ adapter: supabaseAdapter });

  try {
    // 0. Clean Supabase database to avoid constraints collisions
    console.log('\n🧹 0. Đang dọn dẹp các bảng trên Supabase để chuẩn bị đồng bộ...');
    await supabasePrisma.projectMember.deleteMany({});
    await supabasePrisma.project.deleteMany({});
    await supabasePrisma.user.deleteMany({});
    await supabasePrisma.demoLead.deleteMany({});
    console.log('✅ Đã dọn dẹp xong Supabase.');

    // 1. Migrate Users
    console.log('\n👥 1. Đang sao chép bảng User...');
    const localUsers = await localPrisma.user.findMany();
    console.log(`Tìm thấy ${localUsers.length} người dùng ở local.`);
    
    for (const user of localUsers) {
      await supabasePrisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          password: user.password,
          googleId: user.googleId,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          googleId: user.googleId,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    }
    console.log('✅ Đã đồng bộ bảng User lên Supabase.');

    // 2. Migrate Projects
    console.log('\n📂 2. Đang sao chép bảng Project...');
    const localProjects = await localPrisma.project.findMany();
    console.log(`Tìm thấy ${localProjects.length} dự án ở local.`);

    for (const project of localProjects) {
      await supabasePrisma.project.upsert({
        where: { id: project.id },
        update: {
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          centerLon: project.centerLon,
          centerLat: project.centerLat,
          epsg: project.epsg,
          domUrl: project.domUrl,
          metadataUrl: project.metadataUrl,
          modelUrl: project.modelUrl,
          pointCloudId: project.pointCloudId,
          calibration: project.calibration,
          isPublic: project.isPublic,
          createdById: project.createdById,
        },
        create: {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          centerLon: project.centerLon,
          centerLat: project.centerLat,
          epsg: project.epsg,
          domUrl: project.domUrl,
          metadataUrl: project.metadataUrl,
          modelUrl: project.modelUrl,
          pointCloudId: project.pointCloudId,
          calibration: project.calibration,
          isPublic: project.isPublic,
          createdById: project.createdById,
        }
      });
    }
    console.log('✅ Đã đồng bộ bảng Project lên Supabase.');

    // 3. Migrate Project Members
    console.log('\n🤝 3. Đang sao chép bảng ProjectMember...');
    const localMembers = await localPrisma.projectMember.findMany();
    console.log(`Tìm thấy ${localMembers.length} thành viên dự án ở local.`);

    for (const member of localMembers) {
      await supabasePrisma.projectMember.upsert({
        where: { id: member.id },
        update: {
          projectId: member.projectId,
          userId: member.userId,
          role: member.role,
          assignedAt: member.assignedAt,
        },
        create: {
          id: member.id,
          projectId: member.projectId,
          userId: member.userId,
          role: member.role,
          assignedAt: member.assignedAt,
        }
      });
    }
    console.log('✅ Đã đồng bộ bảng ProjectMember lên Supabase.');

    // 4. Migrate Demo Leads
    console.log('\n📝 4. Đang sao chép bảng DemoLead...');
    const localLeads = await localPrisma.demoLead.findMany();
    console.log(`Tìm thấy ${localLeads.length} leads đăng ký ở local.`);

    for (const lead of localLeads) {
      await supabasePrisma.demoLead.upsert({
        where: { id: lead.id },
        update: {
          email: lead.email,
          fullName: lead.fullName,
          jobTitle: lead.jobTitle,
          company: lead.company,
          phone: lead.phone,
          message: lead.message,
          source: lead.source,
          status: lead.status,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        },
        create: {
          id: lead.id,
          email: lead.email,
          fullName: lead.fullName,
          jobTitle: lead.jobTitle,
          company: lead.company,
          phone: lead.phone,
          message: lead.message,
          source: lead.source,
          status: lead.status,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        }
      });
    }
    console.log('✅ Đã đồng bộ bảng DemoLead lên Supabase.');

    console.log('\n🎉 Hoàn thành đồng bộ toàn bộ dữ liệu từ Local lên Supabase thành công!');

  } catch (error: any) {
    console.error('❌ Lỗi trong quá trình đồng bộ:', error.message);
  } finally {
    await localPrisma.$disconnect();
    await supabasePrisma.$disconnect();
    await localPool.end();
    await supabasePool.end();
  }
}

migrateData();
