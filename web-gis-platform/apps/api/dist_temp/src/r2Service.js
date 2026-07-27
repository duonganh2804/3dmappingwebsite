"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProjectFilesFromR2 = exports.uploadProjectFilesToR2 = exports.uploadFolderToR2 = exports.uploadFileToR2 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Khởi tạo S3 client trỏ tới Cloudflare R2
const r2Client = new client_s3_1.S3Client({
    region: 'auto', // Cloudflare R2 dùng 'auto'
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});
const BUCKET = process.env.R2_BUCKET_NAME || 'webgis-assets';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
/**
 * Upload một file lên Cloudflare R2.
 * @param localFilePath Đường dẫn file local cần upload.
 * @param r2Key Tên/đường dẫn file trên R2 (ví dụ: "projects/abc123/dom.jpg").
 * @returns URL công khai của file sau khi upload.
 */
const uploadFileToR2 = async (localFilePath, r2Key) => {
    const fileStream = fs_extra_1.default.createReadStream(localFilePath);
    const fileSize = (await fs_extra_1.default.stat(localFilePath)).size;
    const upload = new lib_storage_1.Upload({
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
        const percent = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
        console.log(`[R2 Upload] ${r2Key}: ${percent}%`);
    });
    await upload.done();
    const publicUrl = `${PUBLIC_URL}/${r2Key}`;
    console.log(`[R2 Upload] ✅ Hoàn tất: ${publicUrl}`);
    return publicUrl;
};
exports.uploadFileToR2 = uploadFileToR2;
/**
 * Upload toàn bộ một thư mục lên R2 (đệ quy).
 */
const uploadFolderToR2 = async (localDirPath, r2Prefix) => {
    const walk = async (dir) => {
        let results = [];
        const list = await fs_extra_1.default.readdir(dir);
        for (const file of list) {
            const filePath = path_1.default.join(dir, file);
            const stat = await fs_extra_1.default.stat(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(await walk(filePath));
            }
            else {
                results.push(filePath);
            }
        }
        return results;
    };
    const files = await walk(localDirPath);
    for (const filePath of files) {
        const relativePath = path_1.default.relative(localDirPath, filePath).replace(/\\/g, '/');
        const r2Key = `${r2Prefix}/${relativePath}`;
        await (0, exports.uploadFileToR2)(filePath, r2Key);
    }
};
exports.uploadFolderToR2 = uploadFolderToR2;
/**
 * Upload toàn bộ file đầu ra của một dự án lên R2.
 * Trả về object chứa các URL đã upload.
 */
const uploadProjectFilesToR2 = async (projectId, outputDir) => {
    const results = {};
    const files = [
        { localName: 'dom/dom.png', key: `projects/${projectId}/dom.png`, field: 'domUrl' },
        { localName: 'glb/model.glb', key: `projects/${projectId}/model.glb`, field: 'modelUrl' },
        { localName: 'dom/metadata.json', key: `projects/${projectId}/metadata.json`, field: 'metadataUrl' }
    ];
    // 1. Upload DOM, GLB và Metadata
    for (const file of files) {
        const localPath = path_1.default.join(outputDir, file.localName);
        if (await fs_extra_1.default.pathExists(localPath)) {
            try {
                results[file.field] = await (0, exports.uploadFileToR2)(localPath, file.key);
            }
            catch (err) {
                console.error(`[R2 Upload] ❌ Lỗi upload ${file.localName}: ${err.message}`);
            }
        }
        else {
            console.log(`[R2 Upload] ⚠️ Bỏ qua (không tồn tại): ${localPath}`);
        }
    }
    // 2. Upload Point Cloud (COPC tiles hoặc single COPC hoặc 3D Tiles)
    const copcPath = path_1.default.join(outputDir, 'pointcloud/cloud.copc.laz');
    const indexPath = path_1.default.join(outputDir, 'pointcloud/index.json');
    const tilesetPath = path_1.default.join(outputDir, 'pointcloud/tileset.json');
    const pcDir = path_1.default.join(outputDir, 'pointcloud');
    if (await fs_extra_1.default.pathExists(indexPath)) {
        // Chiến lược mới: nhiều COPC tiles + index.json
        try {
            console.log(`[R2 Upload] Phát hiện COPC tiles (per-file strategy), upload toàn bộ thư mục...`);
            await (0, exports.uploadFolderToR2)(pcDir, `projects/${projectId}/pointcloud`);
            results.pointCloudUrl = `${PUBLIC_URL}/projects/${projectId}/pointcloud/index.json`;
            console.log(`[R2 Upload] ✅ Point Cloud tiles URL: ${results.pointCloudUrl}`);
        }
        catch (err) {
            console.error(`[R2 Upload] ❌ Lỗi upload COPC tiles: ${err.message}`);
        }
    }
    else if (await fs_extra_1.default.pathExists(copcPath)) {
        try {
            console.log(`[R2 Upload] Phát hiện file COPC đơn, tiến hành upload...`);
            results.pointCloudUrl = await (0, exports.uploadFileToR2)(copcPath, `projects/${projectId}/pointcloud/cloud.copc.laz`);
        }
        catch (err) {
            console.error(`[R2 Upload] ❌ Lỗi upload cloud.copc.laz: ${err.message}`);
        }
    }
    else if (await fs_extra_1.default.pathExists(tilesetPath)) {
        try {
            console.log(`[R2 Upload] Phát hiện thư mục 3D Tiles Point Cloud, tiến hành upload thư mục...`);
            await (0, exports.uploadFolderToR2)(pcDir, `projects/${projectId}/pointcloud`);
            results.pointCloudUrl = `${PUBLIC_URL}/projects/${projectId}/pointcloud/tileset.json`;
        }
        catch (err) {
            console.error(`[R2 Upload] ❌ Lỗi upload thư mục 3D Tiles: ${err.message}`);
        }
    }
    else {
        console.log(`[R2 Upload] ⚠️ Bỏ qua Point Cloud (không tìm thấy COPC tiles, COPC đơn, hoặc 3D Tiles)`);
    }
    return results;
};
exports.uploadProjectFilesToR2 = uploadProjectFilesToR2;
/**
 * Xóa toàn bộ file của một dự án trên R2.
 */
const deleteProjectFilesFromR2 = async (projectId) => {
    const keys = [
        `projects/${projectId}/dom.png`,
        `projects/${projectId}/model.glb`,
        `projects/${projectId}/metadata.json`
    ];
    for (const key of keys) {
        try {
            await r2Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
            console.log(`[R2 Delete] 🗑️ Đã xóa: ${key}`);
        }
        catch (err) {
            console.warn(`[R2 Delete] ⚠️ Không xóa được ${key}: ${err.message}`);
        }
    }
};
exports.deleteProjectFilesFromR2 = deleteProjectFilesFromR2;
function getContentType(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    const types = {
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
