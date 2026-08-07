/**
 * Script tạm thời: Upload dom.png + COPC tiles lên R2 và cập nhật DB
 * Chạy: npx ts-node upload_now.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { uploadProjectFilesToR2 } from './src/r2Service';
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';

const PROJECT_ID = '0261fee6-221e-49c9-b23c-196746f37dd6';
const OUTPUT_DIR = 'C:\\Users\\duong\\3dmaping\\QuyNhon_31072026_output';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis?schema=public'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Bắt đầu upload dữ liệu lên Cloudflare R2...');
  console.log(`   Project ID: ${PROJECT_ID}`);
  console.log(`   Output Dir: ${OUTPUT_DIR}`);

  try {
    const urls = await uploadProjectFilesToR2(PROJECT_ID, OUTPUT_DIR);
    console.log('\n✅ Upload hoàn tất! URLs:');
    console.log(JSON.stringify(urls, null, 2));

    // Cập nhật DB
    const updateData: any = {};
    if (urls.domUrl) updateData.domUrl = urls.domUrl;
    if (urls.modelUrl) updateData.modelUrl = urls.modelUrl;
    if (urls.metadataUrl) updateData.metadataUrl = urls.metadataUrl;
    if (urls.pointCloudUrl) updateData.pointCloudId = urls.pointCloudUrl;

    if (Object.keys(updateData).length > 0) {
      await prisma.project.update({
        where: { id: PROJECT_ID },
        data: updateData
      });
      console.log('\n💾 Đã cập nhật Database thành công:');
      console.log(JSON.stringify(updateData, null, 2));
    }
  } catch (err: any) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
