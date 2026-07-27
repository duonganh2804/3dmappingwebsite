import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
dotenv.config();

import { spawn } from 'child_process';
import { uploadProjectFilesToR2 } from './r2Service';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runCommand(cmd: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    console.log(`Executing: ${cmd} ${args.join(' ')}`);
    const proc = spawn(cmd, args);
    proc.stdout.on('data', (data) => console.log(`[STDOUT] ${data.toString().trim()}`));
    proc.stderr.on('data', (data) => console.error(`[STDERR] ${data.toString().trim()}`));
    proc.on('close', resolve);
  });
}

async function reprocess(projectId: string, inputDir: string, outputDir: string, epsg: number) {
  console.log(`\n========================================`);
  console.log(`Reprocessing Point Cloud for project: ${projectId}`);
  console.log(`Input: ${inputDir}`);
  console.log(`Output: ${outputDir}`);
  console.log(`========================================`);

  const pythonScript = path.join(__dirname, '../../../tools/3d-optimizer/src/build_optimized.py');
  
  // 1. Run build_optimized.py to reprocess point cloud only
  const exitCode = await runCommand('py', [
    '-3.12',
    pythonScript,
    inputDir,
    '-o', outputDir,
    '--epsg', epsg.toString(),
    '--skip-model',
    '--skip-dom'
  ]);

  if (exitCode !== 0) {
    console.error(`❌ Python script failed with exit code: ${exitCode}`);
    return;
  }

  console.log(`✅ Point cloud generation successful!`);

  // 2. Upload to Cloudflare R2
  console.log(`☁️ Uploading to Cloudflare R2...`);
  const urls = await uploadProjectFilesToR2(projectId, outputDir);
  console.log(`Uploaded URLs:`, JSON.stringify(urls, null, 2));

  if (!urls.pointCloudUrl) {
    console.error(`❌ Failed to obtain pointCloudUrl from upload!`);
    return;
  }

  // 3. Update Database
  console.log(`💾 Updating database record...`);
  await prisma.project.update({
    where: { id: projectId },
    data: {
      pointCloudId: urls.pointCloudUrl
    }
  });
  console.log(`🎉 Project ${projectId} updated successfully with pointCloudId = ${urls.pointCloudUrl}`);
}

async function main() {
  await prisma.$connect();
  
  // 1. Reprocess Vuon Uom SHTP
  const vuonUomId = '181271b1-cda2-48bf-b1ad-abdd88f5899e';
  const vuonUomInput = 'c:\\Users\\duong\\Web GIS\\Vuon_Uom_26062026';
  const vuonUomOutput = 'c:\\Users\\duong\\Web GIS\\Vuon_Uom_26062026_Processed';
  await reprocess(vuonUomId, vuonUomInput, vuonUomOutput, 32648);

  // 2. Reprocess Long Phu
  const longPhuId = '6ce58968-25d2-4910-9ca8-43f5c078ca5b';
  const longPhuInput = 'c:\\Users\\duong\\3dmaping\\LongPhu1307\\Process\\LongPhu_1307';
  const longPhuOutput = 'c:\\Users\\duong\\Web GIS\\LongPhu_Processed';
  await reprocess(longPhuId, longPhuInput, longPhuOutput, 32648);

  await prisma.$disconnect();
  await pool.end();
  console.log(`\n🎉 All projects reprocessed successfully!`);
}

main().catch(console.error);
