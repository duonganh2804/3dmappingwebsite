import { uploadProjectFilesToR2 } from './src/r2Service';
import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const projectId = '0261fee6-221e-49c9-b23c-196746f37dd6';
const inputDir = 'C:\\Users\\duong\\3dmaping\\QuyNhon_31072026_process';
const outputDir = 'C:\\Users\\duong\\3dmaping\\QuyNhon_31072026_process_Processed';
const epsg = 32648;

async function runPipeline() {
  console.log(`🚀 KHỞI ĐỘNG PIPELINE CHO DỰ ÁN: ${projectId}`);
  console.log(`📂 Thư mục gốc: ${inputDir}`);
  console.log(`📂 Thư mục đích: ${outputDir}`);

  // 1. Chạy python build
  const pythonCmd = 'C:\\Users\\duong\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
  const buildScript = path.resolve(__dirname, '../../tools/3d-optimizer/src/build_optimized.py');
  
  console.log(`🐍 Đang chạy Python: ${pythonCmd}`);
  
  const pyProcess = spawn(pythonCmd, [
    '-u',
    buildScript,
    inputDir,
    '-o',
    outputDir,
    '--epsg', String(epsg)
  ]);

  pyProcess.stdout.on('data', (data) => {
    process.stdout.write(`[Python] ${data.toString()}`);
  });

  pyProcess.stderr.on('data', (data) => {
    process.stderr.write(`[Python ERROR] ${data.toString()}`);
  });

  pyProcess.on('close', async (code) => {
    if (code !== 0) {
      console.error(`❌ Tiến trình Python thất bại với exit code ${code}`);
      await pool.end();
      process.exit(1);
    }

    console.log(`🎉 Tiến trình Python hoàn tất! Bắt đầu upload lên Cloudflare R2...`);

    try {
      // 2. Upload R2
      const urls = await uploadProjectFilesToR2(projectId, outputDir);
      console.log(`✅ Upload R2 thành công! URLs:`, JSON.stringify(urls, null, 2));

      // 3. Đọc meta xác định tọa độ
      const metaPath = path.join(outputDir, 'dom/metadata.json');
      let centerLon = 106.8099;
      let centerLat = 10.8404;
      
      if (await fs.pathExists(metaPath)) {
        const meta = await fs.readJson(metaPath);
        centerLon = meta.centerLon || (meta.center && meta.center[0]) || centerLon;
        centerLat = meta.centerLat || (meta.center && meta.center[1]) || centerLat;
        console.log(`📍 Tìm thấy tọa độ trung tâm: Lon=${centerLon}, Lat=${centerLat}`);
      }

      // 4. Update Database
      await prisma.project.update({
        where: { id: projectId },
        data: {
          domUrl: urls.domUrl || null,
          modelUrl: urls.modelUrl || null,
          metadataUrl: urls.metadataUrl || null,
          pointCloudId: urls.pointCloudUrl || null,
          centerLon,
          centerLat,
          epsg
        }
      });

      console.log(`💾 Đã cập nhật cơ sở dữ liệu thành công! Bản đồ đã sẵn sàng hiển thị.`);
    } catch (err) {
      console.error(`❌ Lỗi trong quá trình upload/cập nhật DB:`, err);
    } finally {
      await pool.end();
    }
  });
}

runPipeline().catch(async (err) => {
  console.error('Lỗi chạy pipeline:', err);
  await pool.end();
});
