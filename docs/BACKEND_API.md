# Backend API Specifications

## 1. Architectural Style
- Kiến trúc **RESTful API**. Định dạng dữ liệu trả về chuẩn JSON.
- Versioning: `/api/v1/`
- Phân trang (Pagination) và Lọc (Filtering) sử dụng chuẩn (Limit/Offset hoặc Cursor).

## 2. Chuẩn Response Format
Tất cả các API trả về theo một chuẩn duy nhất để Frontend dễ xử lý lỗi (Interceptor):
```json
{
  "success": true,
  "data": { ... },
  "message": "Thao tác thành công",
  "meta": { ... } // Pagination info
}
```
Lỗi:
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Không tìm thấy dự án với ID đã cung cấp"
  }
}
```

## 3. Các API Endpoints Chính

### 3.1. Authentication (`/api/v1/auth`)
- `POST /login`: Đăng nhập, trả về JWT Token.
- `POST /refresh-token`: Cấp lại JWT Token mới.
- `GET /me`: Lấy profile user hiện tại.

### 3.2. Projects (`/api/v1/projects`)
- `GET /`: Danh sách dự án (có query `?workspaceId=&page=1&limit=10`).
- `POST /`: Tạo dự án mới.
- `GET /:id`: Chi tiết dự án (bao gồm luôn danh sách Layers).
- `PUT /:id`: Cập nhật metadata dự án.
- `DELETE /:id`: Xóa dự án (Cần xử lý soft-delete và trigger worker xóa data trên S3).

### 3.3. Layers (`/api/v1/projects/:projectId/layers`)
- `GET /`: Lấy danh sách layer của 1 dự án.
- `POST /`: Thêm layer mới (kèm URL data trên S3).

### 3.4. Measurements (`/api/v1/projects/:projectId/measurements`)
- `GET /`: Lấy các ghi chú, nét vẽ đo đạc đã lưu trên dự án này (để load lại cho user khác xem).
- `POST /`: Lưu một kết quả đo mới.

### 3.5. Data Upload & Processing (`/api/v1/upload`)
- `POST /presigned-url`: Trả về S3 Presigned URL để Frontend upload file nặng trực tiếp lên S3 (Tránh sập Backend).
- `POST /process`: Kích hoạt Worker bắt đầu convert file raw (OSGB) thành 3D Tiles. (Trả về Job ID để Frontend polling trạng thái).

## 4. Bảo mật (Security)
- Rate Limiting: Chống spam request.
- CORS: Chỉ allow origin từ Web App Frontend.
- SQL Injection protection: Nhờ dùng ORM (Prisma/TypeORM).
