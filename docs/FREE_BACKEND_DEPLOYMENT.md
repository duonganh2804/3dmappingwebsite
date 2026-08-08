# Hướng dẫn Triển khai API Backend Miễn phí (Free Hosting)

Tài liệu này phân tích các đặc thù của API Backend GIS và hướng dẫn cách deploy lên các dịch vụ hosting miễn phí phù hợp.

---

## ⚠️ Lưu ý đặc biệt về Backend GIS của bạn

API Backend của dự án Web GIS không phải là một API Node.js thông thường. Nó chứa các công cụ xử lý mô hình 3D (3D Tiles, Point Cloud) được viết bằng Python và yêu cầu các thư viện hệ thống C++ chuyên sâu như:
*   `libproj-dev` (Xử lý hệ tọa độ địa lý)
*   `libgeos-dev` (Xử lý các thực thể hình học không gian)
*   `gcc`, `g++`, `cmake` (Biên dịch các thư viện Python GIS)

**Hậu quả:**
1.  **Không thể deploy lên Vercel hay Netlify**: Các nền tảng serverless này chỉ chạy NodeJS thuần, không có sẵn môi trường Python GIS và không hỗ trợ Docker.
2.  **Yêu cầu RAM lớn**: Quá trình tối ưu hóa hình học, chuyển đổi ảnh trực giao (DOM) và tạo point cloud 3D rất ngốn RAM và CPU. Nếu cấu hình phần cứng quá yếu, máy chủ sẽ bị sập (Out of Memory - OOM).

Dưới đây là 2 giải pháp deploy miễn phí tốt nhất phù hợp với Dockerfile của bạn:

---

## Lựa chọn 1: Render.com (Docker Free Tier - Dễ cấu hình nhất)

Render cho phép bạn kết nối trực tiếp với tài khoản GitHub, tự động build và deploy từ `Dockerfile` mỗi khi bạn push code mới.

*   **Cấu hình Free**: 512 MB RAM, 0.1 vCPU.
*   **Hạn chế**: 
    *   Server sẽ tự động "ngủ" (Sleep) sau 15 phút không có lượt truy cập. Lần gọi đầu tiên sau khi thức dậy sẽ mất khoảng 50 giây để phản hồi.
    *   **Giới hạn RAM 512MB rất dễ bị tràn** khi bạn chạy các luồng xử lý nén mô hình 3D hoặc convert tọa độ lớn.

### Các bước thực hiện:
1.  Đăng ký tài khoản tại [Render.com](https://render.com/) (đăng nhập bằng GitHub).
2.  Tại Dashboard, nhấn **New +** -> Chọn **Web Service**.
3.  Kết nối với Repository GitHub chứa code của bạn.
4.  Cài đặt thông số triển khai:
    *   **Name**: `web-gis-api`
    *   **Language**: Chọn **Docker** (Render sẽ tự nhận diện `Dockerfile`).
    *   **Docker Build Context**: `web-gis-platform` (Thư mục gốc của monorepo).
    *   **Docker Path**: `web-gis-platform/apps/api/Dockerfile`
5.  Nhấp vào nút **Advanced** và thêm các biến môi trường (Environment Variables) từ file `.env` của bạn:
    *   `DATABASE_URL`: Đường dẫn connection pooler cổng 6543 (lấy từ Supabase).
    *   `DIRECT_URL`: Đường dẫn connection pooler cổng 5432 (lấy từ Supabase).
    *   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`: Cấu hình Cloudflare R2 của bạn.
    *   `JWT_SECRET`, `JWT_REFRESH_SECRET`: Khóa bí mật JWT bảo mật token.
6.  Chọn gói **Free** ở dưới cùng và bấm **Create Web Service**.
7.  Đợi khoảng 5–10 phút để Render build Docker image và deploy trực tuyến.

---

## Lựa chọn 2: Hugging Face Spaces (Docker Space - KHUYÊN DÙNG cho GIS)

Hugging Face cung cấp dịch vụ chạy container Docker miễn phí (gọi là Spaces) với cấu hình phần cứng cực kỳ mạnh mẽ, rất thích hợp cho các thuật toán GIS 3D.

*   **Cấu hình Free**: **16 GB RAM, 2 vCPU** (mạnh gấp 32 lần Render!).
*   **Ưu điểm**: Không bị ngủ sau 15 phút, tài nguyên RAM cực lớn thoải mái chạy pipeline 3D mà không sợ sập server.

### Các bước thực hiện:
1.  Đăng ký hoặc đăng nhập tài khoản tại [Hugging Face](https://huggingface.co/).
2.  Nhấp vào avatar góc trên bên phải -> Chọn **New Space**.
3.  Thiết lập thông tin Space:
    *   **Space Name**: `web-gis-platform-api` (tùy chọn).
    *   **License**: Chọn `mit` hoặc để trống.
    *   **SDK**: Chọn **Docker** -> Nhấp chọn template **Blank** (không chọn các template có sẵn).
    *   **Space Hardware**: Giữ mặc định **CPU basic • 2 vCPU • 16 GB RAM • Free**.
    *   **Visibility**: Chọn **Public** (để Frontend từ ngoài Internet có thể gọi API vào).
4.  Nhấp **Create Space**.
5.  Sau khi tạo, trang web sẽ hiển thị URL git của Space (ví dụ: `https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`).
6.  Mở terminal tại thư mục dự án cục bộ trên máy của bạn và đẩy code lên Hugging Face:
    ```bash
    # Thêm remote git của Hugging Face
    git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME

    # Đẩy nhánh main lên để trigger build Docker
    git push hf main
    ```
7.  Cấu hình Biến môi trường:
    *   Trên trang Space của bạn ở Hugging Face, click chọn tab **Settings**.
    *   Cuộn xuống phần **Variables and Secrets**.
    *   Nhấp **New Secret** để thêm các biến nhạy cảm như `DATABASE_URL`, `DIRECT_URL`, `R2_SECRET_ACCESS_KEY`, `JWT_SECRET`.
    *   Nhấp **New Variable** để thêm các biến thường như `R2_ENDPOINT`, `R2_BUCKET_NAME`, `NODE_ENV=production`, `PORT=3000`.
8.  Hugging Face sẽ tự động build từ file Dockerfile của bạn và deploy ứng dụng. API của bạn sẽ chạy trực tuyến tại địa chỉ:
    `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space` (ví dụ: `https://duonganh2804-web-gis-platform-api.hf.space`).
