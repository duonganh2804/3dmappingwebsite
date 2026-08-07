"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateTileset = translateTileset;
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * Module Dịch chuyển tọa độ (Translator)
 * Thay đổi thuộc tính 'transform' trong tileset.json để dịch chuyển toàn bộ dự án 3D Tiles.
 */
async function translateTileset(tilesetPath, offsetX, offsetY, offsetZ) {
    console.log(`Đang phân tích: ${tilesetPath}`);
    if (!await fs_extra_1.default.pathExists(tilesetPath)) {
        console.error("❌ Không tìm thấy file tileset.json!");
        return;
    }
    try {
        const data = await fs_extra_1.default.readJson(tilesetPath);
        if (!data.root) {
            console.error("❌ File không đúng chuẩn 3D Tiles (thiếu thuộc tính root).");
            return;
        }
        let transform = data.root.transform;
        if (!transform) {
            // Nếu không có transform, tạo ma trận đơn vị
            transform = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
        }
        // Thay đổi giá trị tX, tY, tZ (chỉ số 12, 13, 14 trong ma trận 4x4 cột)
        transform[12] += offsetX;
        transform[13] += offsetY;
        transform[14] += offsetZ;
        data.root.transform = transform;
        // Backup file gốc
        const backupPath = tilesetPath + '.backup';
        if (!await fs_extra_1.default.pathExists(backupPath)) {
            await fs_extra_1.default.copy(tilesetPath, backupPath);
        }
        // Ghi đè file mới
        await fs_extra_1.default.writeJson(tilesetPath, data, { spaces: 2 });
        console.log(`✅ Thành công! Đã dịch chuyển ma trận. (File gốc lưu tại .backup)`);
        console.log(`Transform mới: \n[ ${transform.slice(12, 15).join(', ')} ]`);
    }
    catch (e) {
        console.error(`❌ Lỗi khi đọc/ghi file:`, e);
    }
}
