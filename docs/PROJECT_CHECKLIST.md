# Checklist Tiến Độ Dự Án Web GIS Platform

Dựa trên lộ trình phát triển (Project Roadmap), đây là danh sách kiểm tra (checklist) để theo dõi tiến độ công việc của dự án.

## ✅ Đã hoàn thành (Achieved)

### 1. Công cụ Tối ưu hóa dữ liệu Offline
- [x] Tối ưu hóa ảnh DOM (TIF -> JPG/PNG), giải quyết lỗi tràn bộ nhớ, trích xuất ảnh thu nhỏ.
- [x] Đọc `.tfw` và quy đổi tọa độ VN2000 sang WGS84, tự động ghi vào `metadata.json`.
- [x] Tối ưu hóa Mô hình 3D (OBJ -> GLB): Nén texture từ 8K về 2K, ghép các mảnh OBJ.
- [x] Giảm số lượng đa giác lưới xuống 10% và nén Draco/Meshopt bằng `gltfpack`.
- [x] Xử lý lỗi khóa file trên Windows (`WinError 32`).
- [x] Kết nối Backend & Frontend cho công cụ tối ưu.

### 2. Xử lý Point Cloud Offline & COPC Tiles
- [x] Tích hợp Python 3.12 + PDAL pipeline chuyển đổi `.las` sang `.copc.laz` tiles + `index.json`.
- [x] Xử lý hiển thị đa tile COPC linh hoạt trên CesiumJS không dính dữ liệu cũ.
- [x] Thêm bộ chỉnh mật độ Mây điểm (🔥 Cực đại / Cao / Tiêu chuẩn) trên giao diện.

### 3. Định vị Bản đồ & Tải dữ liệu
- [x] Triệt tiêu lệch tọa độ (Khu Vườn Ươm EPSG:9214 & Nhiệt điện Long Phú).
- [x] Đọc trực tiếp calibration offset từ CSDL hoặc localStorage.

### 4. Giao diện & Bộ công cụ Đo đạc
- [x] Giao diện Potree Sidebar với hiệu ứng accordion.
- [x] Tùy chỉnh ngoại quan: Point Size, FOV, bật/tắt Eye Dome Lighting (EDL).
- [x] Bộ đo đạc kiểu Potree: Khoảng cách, Chiều cao đứng (ΔZ), Diện tích mặt phẳng, Xóa công cụ đo.
- [x] Scene Tree: Quản lý hiển thị các lớp bản đồ.
- [x] Chuyển đổi Hệ chiếu Camera: Perspective & Orthographic.

### 5. Cơ sở Dữ liệu & Quản lý Nhiều Dự án (Dynamic Database)
- [x] Cấu hình PostgreSQL + Prisma ORM (`Project` schema).
- [x] Xây dựng Backend REST APIs (CRUD dự án).
- [x] Xây dựng trang Dashboard quản lý dự án trên Frontend (Card Grid, Modal tạo dự án mới).
- [x] Loại bỏ hoàn toàn dữ liệu hardcode, dự án nạp động 100%.

### 7. Hệ Thống Đăng Nhập, Đăng Ký & Phân Quyền Bảo Mật (Auth & Project RBAC)
- [x] Tạo Model `User`, `ProjectMember` và Enums `SystemRole` (`SUPERADMIN`, `USER`), `ProjectRole` (`OWNER`, `EDITOR`, `VIEWER`) trong Prisma ORM.
- [x] Mã hóa mật khẩu an toàn với `bcryptjs` (salt 12 rounds).
- [x] Cơ chế Token Kép (AccessToken JWT 15 phút & RefreshToken Cookie HTTP-Only 7 ngày).
- [x] Middlewares kiểm tra xác thực `authenticateToken`, `optionalAuth` và kiểm soát quyền dự án `requireProjectRole`.
- [x] Chống brute-force đăng nhập bằng `express-rate-limit`.
- [x] Trang Đăng nhập (`LoginPage.tsx`) & Đăng ký (`RegisterPage.tsx`) chuẩn giao diện Geospatial High-Tech HUD.
- [x] Modal Quản lý & Mời thành viên dự án (`ProjectMemberModal.tsx`) dành cho Chủ dự án (`OWNER`).
- [x] Lọc dự án theo quyền truy cập (`isPublic` hoặc `ProjectMember` association).

---

## ❌ Chưa hoàn thành & Lộ trình tiếp theo (Next Steps)

### Bước 4: Tích hợp Công cụ Cắt Mô Hình 3D Nâng Cao (Clipping Box Gizmo)
- [ ] Tích hợp `Cesium.ClippingPlaneCollection` hoặc `Cesium.ClippingPolygon` vào CesiumViewer.
- [ ] Xây dựng Gizmo 3D (khung điều khiển kéo thả) để cắt lát mô hình/mây điểm theo thời gian thực.
- [ ] Lưu vết phép đo đạc (Khoảng cách, Chiều cao, Diện tích) vào Database.

### Bước 5: Đóng gói & Triển khai Hệ thống (Deployment & Production Release)
- [ ] Đóng gói Backend API + Python GIS Tools thành Docker Image (Dockerfile).
- [ ] Kiểm tra và hoàn thiện file `docker-compose.yml` chạy môi trường Staging/Production.
- [ ] Triển khai Frontend lên Vercel / Cloudflare Pages.
- [ ] Triển khai Backend API lên Render / Railway / VPS Ubuntu.
- [ ] Kết nối Domain & SSL Certificate cho hệ thống Web GIS.
