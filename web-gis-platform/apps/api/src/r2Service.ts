import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo S3 client trỏ tới Cloudflare R2
const r2Client = new S3Client({
  region: 'auto', // Cloudflare R2 dùng 'auto'
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  },
  forcePathStyle: true // Ép sử dụng Path-style URL để tránh lỗi DNS giải mã tên miền con của Cloudflare R2
});

const BUCKET = process.env.R2_BUCKET_NAME || 'webgis-assets';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

/**
 * Upload một file lên Cloudflare R2.
 * @param localFilePath Đường dẫn file local cần upload.
 * @param r2Key Tên/đường dẫn file trên R2 (ví dụ: "projects/abc123/dom.jpg").
 * @returns URL công khai của file sau khi upload.
 */
export const uploadFileToR2 = async (
  localFilePath: string,
  r2Key: string,
  silent: boolean = false,
  retries: number = 3
): Promise<string> => {
  const fileSize = (await fs.stat(localFilePath)).size;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Nếu file nhỏ hơn 50 MB, dùng PutObjectCommand trực tiếp để tránh lỗi phân bổ bộ nhớ của lib-storage
      if (fileSize < 50 * 1024 * 1024) {
        const fileBuffer = await fs.readFile(localFilePath);
        await r2Client.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: getContentType(localFilePath)
        }));
        const publicUrl = `${PUBLIC_URL}/${r2Key}`;
        if (!silent) console.log(`[R2 Upload] ✅ Hoàn tất (Direct Put): ${publicUrl}`);
        return publicUrl;
      } else {
        const fileStream = fs.createReadStream(localFilePath);
        const upload = new Upload({
          client: r2Client,
          params: {
            Bucket: BUCKET,
            Key: r2Key,
            Body: fileStream,
            ContentLength: fileSize,
            ContentType: getContentType(localFilePath)
          }
        });

        // Theo dõi tiến trình upload
        upload.on('httpUploadProgress', (progress) => {
          const percent = progress.total ? Math.round((progress.loaded! / progress.total) * 100) : 0;
          if (!silent) console.log(`[R2 Upload] ${r2Key}: ${percent}%`);
        });

        await upload.done();

        const publicUrl = `${PUBLIC_URL}/${r2Key}`;
        if (!silent) console.log(`[R2 Upload] ✅ Hoàn tất: ${publicUrl}`);
        return publicUrl;
      }
    } catch (err: any) {
      if (attempt === retries) {
        console.error(`[R2 Upload] ❌ Thất bại vĩnh viễn sau ${retries} lần thử: ${err.message}`);
        throw err;
      }
      console.warn(`[R2 Upload] ⚠️ Thử lại lần ${attempt}/${retries} cho file ${r2Key} do lỗi: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Upload thất bại sau ${retries} lần thử.`);
};

/**
 * Upload toàn bộ một thư mục lên R2 (đệ quy và song song).
 */
export const uploadFolderToR2 = async (localDirPath: string, r2Prefix: string): Promise<void> => {
  const walk = async (dir: string): Promise<string[]> => {
    let results: string[] = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(await walk(filePath));
      } else {
        results.push(filePath);
      }
    }
    return results;
  };

  const files = await walk(localDirPath);
  const totalFiles = files.length;
  console.log(`[R2 Upload] Phát hiện ${totalFiles} file trong thư mục, bắt đầu tải lên song song (Concurrency limit: 10)...`);

  const concurrencyLimit = 10;
  let index = 0;
  let successCount = 0;

  const uploadNext = async (): Promise<void> => {
    while (index < totalFiles) {
      const currentIdx = index++;
      if (currentIdx >= totalFiles) break;
      const filePath = files[currentIdx];
      const relativePath = path.relative(localDirPath, filePath).replace(/\\/g, '/');
      const r2Key = `${r2Prefix}/${relativePath}`;
      try {
        await uploadFileToR2(filePath, r2Key, true); // true = silent
        successCount++;
        if (successCount % 100 === 0 || successCount === totalFiles) {
          const percent = Math.round((successCount / totalFiles) * 100);
          console.log(`[R2 Upload Progress] Đã tải lên: ${successCount}/${totalFiles} file (${percent}%)`);
        }
      } catch (err: any) {
        console.error(`[R2 Upload] ❌ Lỗi upload file ${relativePath}: ${err.message}`);
      }
    }
  };

  const uploadPromises = [];
  for (let i = 0; i < Math.min(concurrencyLimit, totalFiles); i++) {
    uploadPromises.push(uploadNext());
  }

  await Promise.all(uploadPromises);
  console.log(`[R2 Upload] ✅ Hoàn tất tải lên toàn bộ thư mục! Đã thành công ${successCount}/${totalFiles} file.`);
};

/**
 * Upload toàn bộ file đầu ra của một dự án lên R2.
 * Trả về object chứa các URL đã upload.
 */
export const uploadProjectFilesToR2 = async (
  projectId: string,
  outputDir: string
): Promise<{ domUrl?: string; modelUrl?: string; metadataUrl?: string; pointCloudUrl?: string }> => {
  const results: { domUrl?: string; modelUrl?: string; metadataUrl?: string; pointCloudUrl?: string } = {};

  const files = [
    { localName: 'dom/dom.png', key: `projects/${projectId}/dom.png`, field: 'domUrl' as const },
    { localName: 'glb/model.glb', key: `projects/${projectId}/model.glb`, field: 'modelUrl' as const },
    { localName: 'dom/metadata.json', key: `projects/${projectId}/metadata.json`, field: 'metadataUrl' as const }
  ];

  // 1. Upload DOM, GLB và Metadata
  for (const file of files) {
    const localPath = path.join(outputDir, file.localName);
    if (await fs.pathExists(localPath)) {
      try {
        results[file.field] = await uploadFileToR2(localPath, file.key);
      } catch (err: any) {
        console.error(`[R2 Upload] ❌ Lỗi upload ${file.localName}: ${err.message}`);
      }
    } else {
      console.log(`[R2 Upload] ⚠️ Bỏ qua (không tồn tại): ${localPath}`);
    }
  }

  // 2. Upload Point Cloud (COPC tiles hoặc single COPC hoặc 3D Tiles)
  const copcFullPath = path.join(outputDir, 'pointcloud/cloud_full.copc.laz');
  const copcPath = path.join(outputDir, 'pointcloud/cloud.copc.laz');
  const indexPath = path.join(outputDir, 'pointcloud/index.json');
  const tilesetPath = path.join(outputDir, 'pointcloud/tileset.json');
  const pcDir = path.join(outputDir, 'pointcloud');

  if (await fs.pathExists(tilesetPath)) {
    try {
      console.log(`[R2 Upload] Phát hiện thư mục 3D Tiles Point Cloud, tiến hành upload thư mục...`);
      await uploadFolderToR2(pcDir, `projects/${projectId}/pointcloud`);
      results.pointCloudUrl = `${PUBLIC_URL}/projects/${projectId}/pointcloud/tileset.json`;
      console.log(`[R2 Upload] ✅ 3D Tiles Point Cloud URL: ${results.pointCloudUrl}`);
    } catch (err: any) {
      console.error(`[R2 Upload] ❌ Lỗi upload thư mục 3D Tiles: ${err.message}`);
    }
  } else if (await fs.pathExists(copcFullPath)) {
    try {
      console.log(`[R2 Upload] Phát hiện file cloud_full.copc.laz, tiến hành upload...`);
      results.pointCloudUrl = await uploadFileToR2(copcFullPath, `projects/${projectId}/pointcloud/cloud_full.copc.laz`);
    } catch (err: any) {
      console.error(`[R2 Upload] ❌ Lỗi upload cloud_full.copc.laz: ${err.message}`);
    }
  } else if (await fs.pathExists(indexPath)) {
    // Chiến lược mới: nhiều COPC tiles + index.json
    try {
      console.log(`[R2 Upload] Phát hiện COPC tiles (per-file strategy), upload toàn bộ thư mục...`);
      await uploadFolderToR2(pcDir, `projects/${projectId}/pointcloud`);
      results.pointCloudUrl = `${PUBLIC_URL}/projects/${projectId}/pointcloud/index.json`;
      console.log(`[R2 Upload] ✅ Point Cloud tiles URL: ${results.pointCloudUrl}`);
    } catch (err: any) {
      console.error(`[R2 Upload] ❌ Lỗi upload COPC tiles: ${err.message}`);
    }
  } else if (await fs.pathExists(copcPath)) {
    try {
      console.log(`[R2 Upload] Phát hiện file COPC đơn, tiến hành upload...`);
      results.pointCloudUrl = await uploadFileToR2(copcPath, `projects/${projectId}/pointcloud/cloud.copc.laz`);
    } catch (err: any) {
      console.error(`[R2 Upload] ❌ Lỗi upload cloud.copc.laz: ${err.message}`);
    }
  } else {
    console.log(`[R2 Upload] ⚠️ Bỏ qua Point Cloud (không tìm thấy COPC tiles, COPC đơn, hoặc 3D Tiles)`);
  }

  return results;
};

/**
 * Xóa toàn bộ file của một dự án trên R2.
 */
export const deleteProjectFilesFromR2 = async (projectId: string): Promise<void> => {
  const keys = [
    `projects/${projectId}/dom.png`,
    `projects/${projectId}/model.glb`,
    `projects/${projectId}/metadata.json`
  ];

  for (const key of keys) {
    try {
      await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      console.log(`[R2 Delete] 🗑️ Đã xóa: ${key}`);
    } catch (err: any) {
      console.warn(`[R2 Delete] ⚠️ Không xóa được ${key}: ${err.message}`);
    }
  }
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.glb': 'model/gltf-binary',
    '.json': 'application/json',
    '.tif': 'image/tiff',
    '.pnts': 'application/octet-stream',
    '.laz': 'application/octet-stream',
    '.copc': 'application/octet-stream'
  };
  return types[ext] || 'application/octet-stream';
}
