# Migration Plan: Từ File Tĩnh (index.html) sang React/Vite Enterprise

## 1. Hiện trạng (Current State)
- Code hiện tại đang là một file `index.html` tĩnh (2255 lines).
- Dùng CSS internal `<style>`, tải tài nguyên trực tiếp qua `<script>`.
- Load 3D model trực tiếp từ `.glb` (phù hợp với quy mô nhỏ, không scale được với data vài chục GB).

## 2. Kế hoạch Chuyển đổi (Migration Phases)

### Phase 1: Setup Môi trường & Khởi tạo (1 Tuần)
1. Cài đặt Node.js & pnpm. Khởi tạo Turborepo (Monorepo).
2. Tạo app `web` (Vite + React) và app `api` (Express/NestJS).
3. Bưng toàn bộ logic CSS từ `index.html` sang Tailwind CSS hoặc CSS Modules.
4. Xây dựng Layout cơ bản cho Frontend (Header, Sidebar trống).

### Phase 2: Refactor 3D Viewer (2 Tuần)
1. Gỡ bỏ `Potree` hoặc thiết lập nó thành một component React cô lập (nếu bắt buộc dùng Potree). Tuy nhiên, **Khuyến nghị chuyển sang CesiumJS** để đồng nhất đọc 3D Tiles.
2. Viết component `<CesiumViewer />`.
3. Thay vì load `.glb`, cấu hình Cesium đọc `tileset.json` (3D Tiles) chứa dữ liệu dự án Vườn Ươm (đã convert).
4. Di chuyển logic đo đạc (Khoảng cách, Diện tích) từ Vanilla JS sang React Hooks.

### Phase 3: Quản lý Trạng thái & API (1-2 Tuần)
1. Thiết kế Database PostgreSQL (Bảng `projects`, `layers`).
2. Viết API lấy danh sách dự án.
3. Tạo trang **Dashboard** trên React để hiển thị danh sách dự án dạng lưới.
4. Sửa component `<CesiumViewer />` để nhận `projectId` từ URL (`/viewer/123`), gọi API lấy config URL của 3D Tiles và load động thay vì hardcode.

### Phase 4: Data Processing Pipeline (Liên tục)
- Viết script Python / Node.js offline để convert đống dữ liệu gốc trong thư mục `Vuon_Uom_26062026/Results` (OSGB, TIF) sang 3D Tiles và COG. Đẩy lên S3 bucket phục vụ ứng dụng.
