# BẢN KẾ HOẠCH PHÁT TRIỂN DỰ ÁN WEB GIS (PROJECT ROADMAP)

Tài liệu này tổng hợp toàn bộ hiện trạng dự án, những mục tiêu đã đạt được, những hạn chế hiện tại, và lộ trình chi tiết từng bước từ nay cho đến khi dự án hoàn thiện đưa vào sản xuất (Production).

---

## 🗺️ TỔNG QUAN HIỆN TRẠNG DỰ ÁN

Dự án **Web GIS Platform** là một nền tảng Web 3D hiển thị dữ liệu địa lý quy mô lớn bao gồm: **Ảnh trực giao hàng không (DOM)**, **Mô hình lưới 3D (3D Mesh)**, và **Đám mây điểm (Point Cloud)**. Dự án được chia làm 3 phân hệ chính:
1. **Frontend (`apps/web`):** Sử dụng React + Vite + CesiumJS để kết xuất bản đồ 3D và đo đạc.
2. **Backend API (`apps/api`):** Sử dụng Express + Node.js để quản lý dự án và chạy công cụ tối ưu.
3. **Data Optimizer (`tools/3d-optimizer`):** Sử dụng Python để tối ưu hóa tự động dữ liệu GIS thô (DJI Terra) thành định dạng chuẩn Web.

---

## ✅ 1. CÁC BƯỚC ĐÃ ĐẠT ĐƯỢC (ACHIEVED)

### 1.1. Công cụ Tối ưu hóa dữ liệu Offline (`build_optimized.py`)
* **Tối ưu hóa ảnh DOM (TIF -> JPG):** 
  - Giải quyết lỗi tràn bộ nhớ (Out of Memory) và lỗi giải mã bằng cách tích hợp thư viện `tifffile` + `imagecodecs`.
  - Tự động trích xuất overview thu nhỏ của ảnh TIF (1.44GB) thành ảnh `dom.jpg` nhẹ chỉ **1.73 MB** trong vài giây.
  - Tự động đọc file `.tfw` và quy đổi tọa độ phẳng VN2000 TP.HCM sang toạ độ địa lý WGS84 chính xác ghi vào `metadata.json`.
* **Tối ưu hóa Mô hình 3D (OBJ -> GLB):**
  - Tự động nén ảnh texture của mô hình OBJ từ **8K (8192x8192px) về 2K (2048x2048px)**, giảm dung lượng ảnh 95% và **giảm 16 lần VRAM GPU** trên trình duyệt.
  - Tự động ghép 4 mảnh OBJ rời rạc thành file `model.glb` duy nhất.
  - Tự động chạy thuật toán giảm số lượng đa giác lưới xuống **10%** (Mesh Decimation) và nén Draco/Meshopt bằng `gltfpack`.
  - Kết quả: File GLB giảm từ **236 MB** xuống còn **32.9 MB** siêu nhẹ.
* **Xử lý Khóa file trên Windows:** Tích hợp cơ chế retry loop giúp script hoạt động mượt mà không bị lỗi `WinError 32` khi chạy song song với Vite watcher.
* **Kết nối Backend & Frontend:** Hoàn tất cập nhật API Backend để kích hoạt công cụ và giao diện "Bảng tối ưu 3D" trên Web GUI (hỗ trợ chọn mã EPSG).

### 1.2. Định vị Bản đồ & Tải dữ liệu
* **Triệt tiêu lệch tọa độ:** Định vị thành công Vườn Ươm (Lô E2a-10, Khu Công nghệ cao TP.HCM) bằng cách ánh xạ đúng kinh tuyến trục `105.75` (EPSG:9214). Dữ liệu ảnh DOM và 3D model khớp hoàn hảo với ảnh vệ tinh thực tế của khu vực.
* **Nạp Point Cloud thực tế:** Nạp thành công tệp mây điểm thực tế của người dùng từ tài khoản Cesium Ion cá nhân (ID `5060969`) lên bản đồ CesiumJS.

### 1.3. Giao diện Potree Sidebar & Bộ công cụ Đo đạc (Tích hợp sâu trên CesiumJS)
* **Giao diện Potree Sidebar:** Thiết kế thanh công cụ bên trái mô phỏng chính xác giao diện đặc trưng của Potree, hỗ trợ accordion thu gọn/mở rộng.
* **Ngoại quan (Appearance):** Tích hợp thanh trượt thay đổi kích thước điểm (Point Size), góc nhìn camera (FOV) và bật tắt bộ shading cao cấp **Eye Dome Lighting (EDL)** làm sắc nét mây điểm 3D.
* **Bộ đo đạc kiểu Potree:** Hỗ trợ đo Khoảng cách liên tục (kèm đường dóng nét đứt động), đo Chiều cao đứng (ΔZ) dóng tam giác 3D, đo Diện tích mặt phẳng, và nút Xóa đo.
* **Scene Tree (Cây thư mục):** Tích hợp quản lý hiển thị các lớp bản đồ (Mây điểm, 3D Mesh, Ảnh DOM) trực quan.
* **Hệ chiếu Camera:** Cho phép thay đổi giữa Perspective (Phối cảnh) và Orthographic (Hình chiếu song song).

---

## ❌ 2. CÁC BƯỚC CHƯA ĐẠT ĐƯỢC (NOT ACHIEVED / LIMITATIONS)

### 2.1. Xử lý Point Cloud Offline (LAS -> COPC Tiles)
* **Đã đạt được:** Đã chuyển đổi thành công file mây điểm thô `.las` (hàng trăm triệu điểm) sang định dạng chuẩn **COPC (`.copc.laz`)** kết hợp file chỉ mục `index.json` bằng PDAL trên Python 3.12.
* **Tích hợp CesiumJS:** Tự động đọc và kết xuất trực tiếp các COPC tiles trên CesiumJS không cần qua Cesium Ion.

### 2.2. Cơ sở Dữ liệu & Quản lý Nhiều Dự án (Dynamic Database)
* **Đã đạt được:** Đã cài đặt PostgreSQL + Prisma ORM (`schema.prisma`), xây dựng đầy đủ Backend REST APIs (CRUD) và trang Dashboard trên Frontend.
* **Kết quả:** Đã loại bỏ hoàn toàn dữ liệu nạp cứng (hardcode). Người dùng có thể thêm/xóa/chọn nhiều dự án động (như dự án "Vườn Ươm SHTP", "Nhiệt điện Long Phú").

### 2.3. Tự động Upload & Đồng bộ Cloudflare R2
* **Đã đạt được:** Tích hợp thành công `@aws-sdk/client-s3` với cấu hình `forcePathStyle: true` sửa triệt để lỗi phân giải DNS.
* **Kết quả:** Tự động đẩy dữ liệu ảnh DOM, GLB, Metadata và Point Cloud COPC tiles lên Cloudflare R2 sau khi tối ưu hóa.

---

## 📝 3. LỘ TRÌNH PHÁT TRIỂN TIẾP THEO (WHAT TO DO NEXT)

Dựa trên tiến độ hiện tại, dưới đây là các bước tiếp theo bạn cần thực hiện để đưa ứng dụng vào vận hành sản xuất:

### BƯỚC 4: TÍCH HỢP CÔNG CỤ CẮT MÔ HÌNH 3D (CLIPPING BOX GIZMO) & LƯU VẾT ĐO ĐẠC
1. **Công cụ cắt mô hình 3D (Clipping Box):**
   - Tích hợp `Cesium.ClippingPlaneCollection` hoặc `Cesium.ClippingPolygon` gán vào mô hình GLB và Point Cloud.
   - Xây dựng Gizmo 3D (khung điều khiển kéo thả) để người dùng điều chỉnh hộp cắt (Bounding Box) theo thời gian thực.
2. **Lưu vết đo đạc (Measurements Persistence):**
   - Lưu trữ các đo đạc Khoảng cách, Chiều cao, Diện tích vào CSDL theo `projectId` để khi mở lại dự án các nét vẽ đo đạc không bị mất.

---

### BƯỚC 5: ĐÓNG GÓI DOCKER & TRIỂN KHAI HỆ THỐNG (DEPLOYMENT)
1. **Đóng gói Docker (Dockerization):**
   - Tạo `Dockerfile` hoàn chỉnh cho `apps/api` (bao gồm môi trường Node.js + Python 3.12 + GDAL / PDAL / gltfpack).
   - Hoàn thiện `docker-compose.yml` để khởi chạy đồng bộ PostgreSQL + API + Web Frontend.
2. **Triển khai Cloud Production:**
   - **Frontend:** Build bản tĩnh (`npm run build`) và deploy lên **Vercel** hoặc **Cloudflare Pages**.
   - **Backend API:** Deploy Docker container lên **Render.com**, **Railway**, hoặc VPS Ubuntu.
   - **Database:** Chuyển sang Managed Database (Supabase PostgreSQL).
   - **Storage:** Sử dụng Cloudflare R2 (Đã sẵn sàng).
