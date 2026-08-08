# Hướng dẫn chi tiết Triển khai Database lên Supabase (Web GIS & Prisma)

Tài liệu này hướng dẫn chi tiết cách cấu hình, tạo tài khoản và triển khai cơ sở dữ liệu PostgreSQL có tích hợp **PostGIS** của dự án Web GIS lên **Supabase**, đồng thời hướng dẫn cách cấu hình **Prisma ORM** để hỗ trợ Connection Pooling (Bộ gom kết nối) trên production.

---

## 1. Chuẩn bị trên Supabase

### Bước 1: Tạo dự án mới
1. Đăng nhập hoặc đăng ký tài khoản tại [Supabase](https://supabase.com/).
2. Nhấp vào nút **New Project** và chọn Tổ chức (Organization) của bạn.
3. Điền các thông tin dự án:
   - **Name**: `web-gis-platform` (hoặc tên tùy ý).
   - **Database Password**: Nhập mật khẩu mạnh (bắt buộc phải lưu lại mật khẩu này).
   - **Region**: Chọn khu vực gần người dùng của bạn nhất để giảm độ trễ (ví dụ: `Southeast Asia (Singapore)` đối với người dùng ở Việt Nam).
   - **Pricing Plan**: Chọn gói **Free** hoặc phù hợp với nhu cầu.
4. Nhấp vào **Create new project** và chờ khoảng 1–2 phút để Supabase chuẩn bị hạ tầng.

### Bước 2: Kích hoạt extension PostGIS
Dự án Web GIS của bạn sử dụng PostGIS để xử lý và truy vấn dữ liệu địa lý không gian (Spatial Data). Bạn cần kích hoạt extension này trên Supabase:
1. Tại Dashboard dự án trên Supabase, chọn mục **Database** ở menu bên trái (biểu tượng hình trụ).
2. Click chọn mục **Extensions**.
3. Tìm kiếm từ khóa `postgis`.
4. Click **Enable** (Kích hoạt) extension `postgis` (nếu chưa được bật).
   - *Lưu ý*: Bạn cũng có thể kích hoạt bằng cách chạy câu lệnh SQL sau trong mục **SQL Editor** của Supabase:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```

---

## 2. Lấy chuỗi kết nối (Connection Strings) từ Supabase

Prisma cần hai loại chuỗi kết nối khi làm việc với Supabase:
1. **Connection Pooler (Cổng `6543`)**: Dùng cho ứng dụng chạy runtime hàng ngày (API Backend) để tối ưu hóa số lượng kết nối đồng thời từ Serverless hoặc Container.
2. **Direct Connection (Cổng `5432`)**: Dùng trực tiếp để chạy các câu lệnh thay đổi cấu trúc bảng (migrations) như `prisma db push` hoặc `prisma migrate deploy`.

### Cách lấy thông tin kết nối trên Supabase:
1. Vào **Project Settings** (biểu tượng bánh răng ở góc dưới bên trái Dashboard).
2. Chọn mục **Database**.
3. Cuộn xuống phần **Connection string**:
   - Chọn tab **URI**.
   - Bật hoặc giữ mặc định tùy chọn **Use connection pooler** (để lấy link kết nối qua cổng `6543`). Chọn **Mode: Transaction**. Copy chuỗi kết nối này để đặt vào `DATABASE_URL`.
   - Bỏ tích **Use connection pooler** (hoặc chọn cổng `5432` / **Mode: Session** tùy theo giao diện hiển thị của Supabase) để lấy chuỗi kết nối trực tiếp. Copy chuỗi kết nối này để đặt vào `DIRECT_URL`.

---

## 3. Cấu hình Prisma và Môi trường (.env)

### Bước 1: Cập nhật file Prisma Schema
Mở file [schema.prisma](file:///c:/Users/duong/Web%20GIS/web-gis-platform/apps/api/prisma/schema.prisma) và cấu hình lại khối `datasource db` để sử dụng cả `url` và `directUrl`.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Sử dụng Connection Pooler (Port 6543)
  directUrl = env("DIRECT_URL")     // Kết nối trực tiếp (Port 5432)
}
```

> **Lưu ý dành cho kiến trúc nâng cao**:
> Nếu bạn áp dụng schema nâng cao (có chứa kiểu dữ liệu `Unsupported("geometry(...)")` như mô tả trong tài liệu [DATABASE.md](file:///c:/Users/duong/Web%20GIS/docs/DATABASE.md)), hãy cấu hình schema như sau để Prisma nhận diện các extension của PostgreSQL:
> ```prisma
> generator client {
>   provider        = "prisma-client-js"
>   previewFeatures = ["postgresqlExtensions"]
> }
> 
> datasource db {
>   provider   = "postgresql"
>   url        = env("DATABASE_URL")
>   directUrl  = env("DIRECT_URL")
>   extensions = [postgis]
> }
> ```

### Bước 2: Cấu hình file `.env` cho API Backend
Mở file `.env` trong thư mục [apps/api](file:///c:/Users/duong/Web%20GIS/web-gis-platform/apps/api/.env) và cập nhật hai biến môi trường này (thay thế mật khẩu và mã dự án của bạn):

```env
# 1. Connection Pooler URL (Transaction Mode - Cổng 6543)
# Thêm tham số ?pgbouncer=true ở cuối nếu pooler sử dụng PgBouncer
DATABASE_URL="postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 2. Direct Connection URL (Session Mode - Cổng 5432)
DIRECT_URL="postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

*Ví dụ thực tế:*
- Nếu mật khẩu là `SuperSafePass123` và reference ID của dự án Supabase là `abcxyz12345`:
  ```env
  DATABASE_URL="postgres://postgres.abcxyz12345:SuperSafePass123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgres://postgres:SuperSafePass123@db.abcxyz12345.supabase.co:5432/postgres"
  ```

---

## 4. Triển khai cấu trúc bảng (Deploy Migrations)

Sau khi lưu cấu hình file `.env`, bạn tiến hành đồng bộ các bảng của bạn lên cơ sở dữ liệu Supabase:

### Cách 1: Sử dụng lịch sử migrations có sẵn (Khuyên dùng cho Production)
Nếu dự án đã có các tệp migration trong thư mục `prisma/migrations`, hãy chạy lệnh sau từ thư mục `apps/api`:

```bash
# Di chuyển tới thư mục api
cd web-gis-platform/apps/api

# Chạy migrations lên Supabase
npx prisma migrate deploy
```
*Lệnh này sẽ đọc lịch sử migration và áp dụng trực tiếp lên cơ sở dữ liệu Supabase của bạn mà không làm thay đổi trạng thái dev cục bộ.*

### Cách 2: Đẩy trực tiếp Schema (Thích hợp khi thử nghiệm nhanh)
Nếu bạn chưa tạo migrations mà chỉ muốn đẩy trực tiếp cấu trúc của schema lên database Supabase ngay lập tức:

```bash
cd web-gis-platform/apps/api
npx prisma db push
```

---

## 5. Tạo các Spatial Index cho PostGIS (Thủ công)

Như được đề cập ở [DATABASE.md](file:///c:/Users/duong/Web%20GIS/docs/DATABASE.md#L158-L172), vì Prisma không tự động tạo các chỉ mục không gian (Spatial Index) cho các cột dữ liệu địa lý hình học như `geom` hay `center_point` (sử dụng loại `Unsupported`), bạn cần thực hiện tạo thủ công để tối ưu hóa hiệu năng truy vấn GIS:

1. Truy cập vào giao diện dự án Supabase của bạn.
2. Chọn mục **SQL Editor** ở thanh menu bên trái (biểu tượng mã `SQL`).
3. Nhấp vào **New Query** (Tạo truy vấn mới).
4. Dán đoạn mã SQL dưới đây và nhấn **Run** (Chạy):
   ```sql
   -- Tạo Spatial Index cho cột center_point của bảng projects (nếu dùng schema nâng cao)
   CREATE INDEX IF NOT EXISTS idx_projects_center_point ON projects USING GIST (center_point);

   -- Tạo Spatial Index cho các nét vẽ đo đạc hình học
   CREATE INDEX IF NOT EXISTS idx_measurements_geom ON measurements USING GIST (geom);

   -- Tạo Index trên các trường dữ liệu JSONB cấu hình hiển thị bản đồ
   CREATE INDEX IF NOT EXISTS idx_layers_display_config ON layers USING GIN (display_config);
   ```

---

## 6. Những lưu ý bảo mật quan trọng trên Supabase

1. **Row Level Security (RLS)**:
   - Supabase kích hoạt cơ chế bảo mật hàng dữ liệu (RLS) để ngăn chặn truy cập không hợp lệ từ bên ngoài client.
   - **Tuy nhiên**, do API của bạn kết nối với database bằng tài khoản admin (`postgres`) thông qua chuỗi kết nối phía backend, **API của bạn sẽ tự động bỏ qua cơ chế RLS**. Bạn không cần cấu hình Policy RLS nếu chỉ truy cập dữ liệu thông qua backend Node.js.
   - Nếu bạn dự định viết code React Frontend để gọi trực tiếp tới Supabase qua client SDK (không thông qua API trung gian), bạn bắt buộc phải bật RLS trên Supabase Dashboard và thiết lập các Policy cho phép đọc/ghi dựa trên JWT của Supabase Auth.

2. **Kết nối mạng & Firewall (Mặc định công khai)**:
   - Các cơ sở dữ liệu Supabase mở cổng kết nối công khai ra Internet (qua DNS). Hãy chắc chắn rằng mật khẩu Database của bạn đủ phức tạp để tránh các cuộc tấn công Brute-force.
   - Không chia sẻ các chuỗi kết nối có chứa mật khẩu lên Github hoặc các kho lưu trữ công cộng. Hãy sử dụng file `.env` đã được bỏ qua trong `.gitignore`.
