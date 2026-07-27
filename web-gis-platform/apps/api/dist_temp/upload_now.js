"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script tạm thời: Upload dom.png + COPC tiles lên R2 và cập nhật DB
 * Chạy: npx ts-node upload_now.ts
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const r2Service_1 = require("./src/r2Service");
const client_1 = require("./src/generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const PROJECT_ID = '181271b1-cda2-48bf-b1ad-abdd88f5899e';
const OUTPUT_DIR = 'c:\\Users\\duong\\Web GIS\\Vuon_Uom_26062026_Processed';
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/webgis?schema=public'
});
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🚀 Bắt đầu upload dữ liệu lên Cloudflare R2...');
    console.log(`   Project ID: ${PROJECT_ID}`);
    console.log(`   Output Dir: ${OUTPUT_DIR}`);
    try {
        const urls = await (0, r2Service_1.uploadProjectFilesToR2)(PROJECT_ID, OUTPUT_DIR);
        console.log('\n✅ Upload hoàn tất! URLs:');
        console.log(JSON.stringify(urls, null, 2));
        // Cập nhật DB
        const updateData = {};
        if (urls.domUrl)
            updateData.domUrl = urls.domUrl;
        if (urls.modelUrl)
            updateData.modelUrl = urls.modelUrl;
        if (urls.metadataUrl)
            updateData.metadataUrl = urls.metadataUrl;
        if (urls.pointCloudUrl)
            updateData.pointCloudId = urls.pointCloudUrl;
        if (Object.keys(updateData).length > 0) {
            await prisma.project.update({
                where: { id: PROJECT_ID },
                data: updateData
            });
            console.log('\n💾 Đã cập nhật Database thành công:');
            console.log(JSON.stringify(updateData, null, 2));
        }
    }
    catch (err) {
        console.error('❌ Lỗi:', err.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
