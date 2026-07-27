# Hướng dẫn Triển khai Database (PostgreSQL + PostGIS) và Cloudflare CDN / R2

Tài liệu này hướng dẫn chi tiết cách thiết lập cơ sở dữ liệu không gian (Spatial Database) với PostgreSQL + PostGIS, và cấu hình lưu trữ tĩnh phân phối qua mạng nội dung Cloudflare (Cloudflare CDN / R2) cho dự án Web GIS.

---

## 1. Triển khai Cơ sở dữ liệu (PostgreSQL + PostGIS)

PostGIS là một extension (tiện ích mở rộng) của PostgreSQL, cho phép lưu trữ và truy vấn dữ liệu địa lý/không gian hiệu quả (như điểm, đường, đa giác).

### Lựa chọn Nền tảng (Hosting)

Để dễ dàng quản lý và tối ưu chi phí, bạn có thể cân nhắc các nhà cung cấp sau:
- **Supabase / Neon**: Serverless PostgreSQL, thường có sẵn PostGIS.
- **Render / Railway**: Managed Database, dễ thiết lập.
- **Tự host (VPS / EC2)**: Cần sử dụng Docker để cài đặt nhanh.

### Cách tự cài đặt bằng Docker (Trên VPS Ubuntu / Server riêng)

Nếu bạn có máy chủ riêng, cách nhanh nhất là dùng Docker image `postgis/postgis`.

1. **Cài đặt Docker** trên server của bạn.
2. **Chạy container PostgreSQL + PostGIS**:
   ```bash
   docker run --name webgis-db \
     -e POSTGRES_USER=gis_user \
     -e POSTGRES_PASSWORD=your_secure_password \
     -e POSTGRES_DB=webgis_db \
     -p 5432:5432 \
     -d postgis/postgis:15-3.4
   ```
   *(Image trên bao gồm PostgreSQL bản 15 và PostGIS bản 3.4)*

3. **Kết nối tới Database và Kích hoạt PostGIS**:
   Mặc định image trên đã kích hoạt PostGIS. Nếu bạn dùng nhà cung cấp khác (như AWS RDS hoặc tự cài PostgreSQL thuần), bạn cần chạy lệnh SQL sau trong database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

### Cấu hình trong Backend Node.js / Express

Cập nhật chuỗi kết nối vào file `.env` của thư mục `apps/api`:
```env
DATABASE_URL="postgres://gis_user:your_secure_password@<IP_CỦA_SERVER>:5432/webgis_db"
```

Bạn có thể sử dụng các thư viện như `pg`, `Prisma`, hoặc `TypeORM` để truy vấn:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ví dụ truy vấn dữ liệu không gian
export const getNearbyPoints = async (lng: number, lat: number) => {
  const result = await pool.query(`
    SELECT id, name, 
           ST_AsGeoJSON(geom) as geometry 
    FROM locations 
    WHERE ST_DWithin(geom, ST_MakePoint($1, $2)::geography, 1000)
  `, [lng, lat]);
  return result.rows;
};
```

---

## 2. Triển khai Cloudflare CDN và R2

Vì dự án Web GIS chứa các dữ liệu 3D, ảnh DOM và Point Cloud có dung lượng lớn, việc sử dụng Cloudflare R2 (lưu trữ) kết hợp Cloudflare CDN (phân phối) giúp tốc độ tải nhanh chóng, tiết kiệm băng thông (R2 không tính phí egress - phí băng thông tải ra).

### Bước 1: Tạo Bucket R2
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn mục **R2 Object Storage** ở menu bên trái.
3. Bấm **Create bucket**, đặt tên (vd: `webgis-data`).
4. Nhấn **Create bucket**.

### Bước 2: Bật CDN và Custom Domain cho Bucket
Để các file 3D (`.glb`, `.b3dm`, ảnh `.jpg`) được phân phối qua CDN và client đọc trực tiếp được:
1. Mở bucket vừa tạo, chuyển sang tab **Settings**.
2. Ở phần **Public access**, mục **Custom Domains**, chọn **Connect Domain**.
3. Nhập một domain bạn đã cấu hình DNS trên Cloudflare (vd: `assets.yourdomain.com`).
4. (Hoặc) Bật **R2.dev subdomain** nếu bạn muốn dùng link mặc định (chỉ nên dùng cho môi trường test).

> **Lưu ý quan trọng cho Web GIS**: 
> Chuyển sang tab **Settings** -> **CORS Settings** và thêm rules để cho phép trình duyệt (CesiumJS/Vite) tải file từ CDN:
> ```json
> [
>   {
>     "AllowedOrigins": ["*"],
>     "AllowedMethods": ["GET", "HEAD"],
>     "AllowedHeaders": ["*"],
>     "ExposeHeaders": []
>   }
> ]
> ```

### Bước 3: Tạo API Token để Backend Upload File
1. Quay lại trang chủ R2, chọn **Manage R2 API Tokens**.
2. Bấm **Create API token**.
3. Đặt quyền (Permissions) là **Object Read & Write**.
4. Lưu lại `Access Key ID`, `Secret Access Key` và `Endpoint`.

### Bước 4: Tích hợp Upload R2 trong Backend
Sử dụng AWS SDK (vì R2 tương thích S3).

1. **Cài đặt thư viện**:
   ```bash
   cd apps/api
   npm install @aws-sdk/client-s3
   ```
2. **Cấu hình biến môi trường (`.env`)**:
   ```env
   R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
   R2_ACCESS_KEY="<YOUR_ACCESS_KEY>"
   R2_SECRET_KEY="<YOUR_SECRET_KEY>"
   R2_BUCKET_NAME="webgis-data"
   CDN_URL="https://assets.yourdomain.com"
   ```
3. **Mã nguồn Upload (`apps/api/src/services/storage.ts`)**:
   ```typescript
   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
   import fs from 'fs';

   const s3 = new S3Client({
     region: "auto",
     endpoint: process.env.R2_ENDPOINT,
     credentials: {
       accessKeyId: process.env.R2_ACCESS_KEY as string,
       secretAccessKey: process.env.R2_SECRET_KEY as string,
     },
   });

   export const uploadToR2 = async (filePath: string, destKey: string) => {
     const fileStream = fs.createReadStream(filePath);
     await s3.send(new PutObjectCommand({
       Bucket: process.env.R2_BUCKET_NAME,
       Key: destKey,
       Body: fileStream,
     }));

     // Trả về URL CDN cho client
     return `${process.env.CDN_URL}/${destKey}`;
   };
   ```

Khi client lấy dữ liệu 3D, Frontend (CesiumJS) chỉ cần gọi đường dẫn CDN đã được trả về (`https://assets.yourdomain.com/model/data.glb`). Dữ liệu sẽ tự động được cache trên các máy chủ edge của Cloudflare.
