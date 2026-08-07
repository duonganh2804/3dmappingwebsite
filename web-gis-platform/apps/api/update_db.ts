/**
 * Script cập nhật database cho dự án Quy Nhơn
 * Chạy: npx tsx update_db.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const PROJECT_ID = '0261fee6-221e-49c9-b23c-196746f37dd6';
const pointCloudUrl = 'https://pub-1d5704adea5c46b3920fd8f19e3c3480.r2.dev/projects/0261fee6-221e-49c9-b23c-196746f37dd6/pointcloud/tileset.json';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis?schema=public'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Updating database for project ${PROJECT_ID}...`);
  try {
    await prisma.project.update({
      where: { id: PROJECT_ID },
      data: {
        pointCloudId: pointCloudUrl
      }
    });
    console.log('✅ Database updated successfully!');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
