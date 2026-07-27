import fs from 'fs-extra';
import path from 'path';

/**
 * Module Dịch chuyển tọa độ (Translator)
 * Thay đổi thuộc tính 'transform' trong tileset.json để dịch chuyển toàn bộ dự án 3D Tiles.
 */
export async function translateTileset(tilesetPath: string, offsetX: number, offsetY: number, offsetZ: number) {
    console.log(`Đang phân tích: ${tilesetPath}`);
    
    if (!await fs.pathExists(tilesetPath)) {
        console.error("❌ Không tìm thấy file tileset.json!");
        return;
    }

    try {
        const data = await fs.readJson(tilesetPath);
        
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
        if (!await fs.pathExists(backupPath)) {
            await fs.copy(tilesetPath, backupPath);
        }

        // Ghi đè file mới
        await fs.writeJson(tilesetPath, data, { spaces: 2 });
        
        console.log(`✅ Thành công! Đã dịch chuyển ma trận. (File gốc lưu tại .backup)`);
        console.log(`Transform mới: \n[ ${transform.slice(12, 15).join(', ')} ]`);
        
    } catch (e) {
        console.error(`❌ Lỗi khi đọc/ghi file:`, e);
    }
}
