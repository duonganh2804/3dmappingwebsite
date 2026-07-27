import { Command } from 'commander';
import path from 'path';
import { compressFile } from './compressor';
import { translateTileset } from './translator';

const program = new Command();

program
  .name('3d-optimizer')
  .description('Công cụ xử lý và tối ưu hóa dữ liệu 3D GIS (Compression & Translation)')
  .version('1.0.0');

program.command('compress')
  .description('Nén file GLB/GLTF bằng thuật toán Draco')
  .argument('<input>', 'Đường dẫn file đầu vào (.glb, .gltf)')
  .argument('[output]', 'Đường dẫn file xuất ra. Nếu không nhập, sẽ ghi đè file gốc.')
  .action(async (input, output) => {
    const inputPath = path.resolve(input);
    const outputPath = output ? path.resolve(output) : inputPath.replace(/\.glb$/, '_compressed.glb');
    await compressFile(inputPath, outputPath);
  });

program.command('batch')
  .description('Quét toàn bộ thư mục và nén tất cả các file 3D bên trong (hỗ trợ đọc thẳng .obj của DJI Terra)')
  .argument('<inputDir>', 'Thư mục gốc chứa dữ liệu')
  .argument('<outputDir>', 'Thư mục xuất dữ liệu đã tối ưu')
  .action(async (inputDir, outputDir) => {
    await import('./compressor').then(m => m.batchProcessDirectory(path.resolve(inputDir), path.resolve(outputDir)));
  });

program.command('translate')
  .description('Dịch chuyển mô hình 3D (sửa ma trận transform trong tileset.json)')
  .argument('<tileset>', 'Đường dẫn tới file tileset.json')
  .option('-x, --x <number>', 'Khoảng cách dịch chuyển trục X (mét)', parseFloat, 0)
  .option('-y, --y <number>', 'Khoảng cách dịch chuyển trục Y (mét)', parseFloat, 0)
  .option('-z, --z <number>', 'Khoảng cách dịch chuyển trục Z (độ cao - mét)', parseFloat, 0)
  .action(async (tileset, options) => {
    const tilesetPath = path.resolve(tileset);
    await translateTileset(tilesetPath, options.x, options.y, options.z);
  });

program.parse();
