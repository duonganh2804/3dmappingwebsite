import fs from 'fs-extra';
import path from 'path';
// @ts-ignore
import gltfPipeline from 'gltf-pipeline';
// @ts-ignore
import obj2gltf from 'obj2gltf';

const processGltf = gltfPipeline.processGltf;
const processGlb = gltfPipeline.processGlb;

export async function compressFile(inputPath: string, outputPath: string) {
    const ext = path.extname(inputPath).toLowerCase();
    console.log(`Đang xử lý: ${path.basename(inputPath)} ...`);

    let finalGlbData: Buffer;

    try {
        await fs.ensureDir(path.dirname(outputPath));
        const options = { dracoOptions: { compressionLevel: 7 } };

        if (ext === '.obj') {
            // Bước 1: Convert OBJ -> GLTF dạng Buffer
            const gltfObj = await obj2gltf(inputPath);
            // Bước 2: Nén Draco
            const results = await processGltf(gltfObj, options);
            finalGlbData = results.glb || Buffer.from(JSON.stringify(results.gltf));
            
            // Ép xuất ra .glb
            if (!outputPath.endsWith('.glb')) {
                outputPath = outputPath.replace(/\.obj$/, '.glb');
            }
        } else {
            const gltf = await fs.readFile(inputPath);
            let results;
            if (ext === '.glb') {
                results = await processGlb(gltf, options);
                finalGlbData = results.glb;
            } else if (ext === '.gltf') {
                const gltfObj = JSON.parse(gltf.toString());
                results = await processGltf(gltfObj, options);
                finalGlbData = Buffer.from(JSON.stringify(results.gltf));
            } else {
                throw new Error(`Định dạng ${ext} chưa hỗ trợ.`);
            }
        }

        await fs.writeFile(outputPath, finalGlbData);

        const oldSize = (await fs.stat(inputPath)).size;
        const newSize = (await fs.stat(outputPath)).size;
        const ratio = ((1 - newSize / oldSize) * 100).toFixed(2);
        
        console.log(`✅ Thành công! Giảm ${ratio}%. Mới: ${(newSize / 1024 / 1024).toFixed(2)} MB -> ${path.basename(outputPath)}`);
    } catch (e) {
        console.error(`❌ Lỗi khi nén ${inputPath}:`, e);
    }
}

// Chạy đệ quy quét toàn bộ folder
export async function batchProcessDirectory(inputDir: string, outputDir: string) {
    console.log(`🚀 Bắt đầu quét thư mục: ${inputDir}`);
    
    async function scanAndProcess(currentDir: string, targetDir: string) {
        const files = await fs.readdir(currentDir);
        
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const relativePath = path.relative(inputDir, fullPath);
            const targetPath = path.join(targetDir, relativePath);
            
            const stat = await fs.stat(fullPath);
            
            if (stat.isDirectory()) {
                await fs.ensureDir(targetPath);
                await scanAndProcess(fullPath, path.join(targetDir, file)); // Đệ quy
            } else {
                const ext = path.extname(file).toLowerCase();
                // Chỉ nén các file mô hình
                if (['.obj', '.glb', '.gltf'].includes(ext)) {
                    // Nếu là obj, đầu ra phải là glb
                    const finalTargetPath = targetPath.replace(/\.(obj|gltf)$/, '.glb');
                    await compressFile(fullPath, finalTargetPath);
                } else {
                    // Các file khác (metadata.xml, .mtl, .jpg) copy sang thư mục mới
                    await fs.copy(fullPath, targetPath, { overwrite: true });
                }
            }
        }
    }
    
    await scanAndProcess(inputDir, outputDir);
    console.log("🎉 Hoàn tất Batch Processing!");
}
