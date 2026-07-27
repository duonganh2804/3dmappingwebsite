# System Architecture (Web GIS 3D Mapping Platform)

## 1. Overview
Hệ thống Web GIS là nền tảng quản lý, trực quan hóa và phân tích dữ liệu 3D Mapping (Point Cloud, 3D Mesh, Orthophoto) trên trình duyệt. Kiến trúc được thiết kế theo tiêu chuẩn Enterprise, đảm bảo khả năng mở rộng (Scalability), tính sẵn sàng cao (High Availability), và hiệu năng xử lý dữ liệu lớn.

## 2. High-Level Architecture (Kiến trúc tổng thể)

Hệ thống được chia thành 4 lớp (Tiers) chính:

### 2.1. Client Tier (Frontend)
- **Công nghệ:** React 18, TypeScript, Vite, TailwindCSS.
- **3D Engine:** CesiumJS (cho hiển thị 3D Tiles) & OpenLayers/MapboxGL (cho 2D map).
- **State Management:** Zustand (hoặc Redux Toolkit) để quản lý Global State (Project ID, Active Layers, Measurement Tools).
- **Nhiệm vụ:** Rendering UI, xử lý tương tác người dùng, streaming dữ liệu 3D, tính toán đo đạc phía client.

### 2.2. API Tier (Backend Application)
- **Công nghệ:** Node.js (NestJS hoặc Express + TypeScript).
- **Architecture:** Microservices hoặc Modular Monolith.
- **Nhiệm vụ:**
  - Quản lý xác thực và phân quyền (Authentication/Authorization - JWT/OAuth2).
  - Quản lý Metadata của Dự án, User, Workspace.
  - Phục vụ API RESTful/GraphQL cho Frontend.

### 2.3. Data Processing Tier (Background Workers)
- **Công nghệ:** Python (FastAPI/Celery) hoặc Node.js Worker Threads, RabbitMQ/Redis (Message Queue).
- **Công cụ Core:** GDAL/PDAL, Cesium Pipeline, py3dtiles.
- **Nhiệm vụ:**
  - Lắng nghe event khi có file mới được upload.
  - Chuyển đổi định dạng thô (OSGB, OBJ, LAS, TIF) sang định dạng streaming (3D Tiles, COG, EPT).

### 2.4. Storage & Database Tier
- **Relational Database:** PostgreSQL với PostGIS extension (lưu trữ metadata, vector data, polygon, điểm đo đạc).
- **Object Storage:** S3-compatible (AWS S3, MinIO, Google Cloud Storage) để lưu trữ hàng trăm GB dữ liệu 3D Tiles và COG.
- **Cache:** Redis (cache query, session).
- **CDN:** Cloudflare/AWS CloudFront đứng trước Object Storage để giảm tải băng thông và độ trễ khi streaming 3D.

## 3. Data Flow (Luồng dữ liệu)
1. **Upload:** Người dùng upload dữ liệu OSGB/TIF qua Portal -> Lưu vào `raw-bucket` (S3).
2. **Process:** S3 trigger Event -> Worker Queue -> Worker tải raw data, convert sang 3D Tiles/COG -> Lưu vào `processed-bucket` (S3).
3. **Serve:** Frontend gọi API lấy Project Info -> API trả về URL của 3D Tiles trên `processed-bucket`.
4. **Render:** CesiumJS trên Frontend stream data trực tiếp từ `processed-bucket` thông qua CDN (không đi qua Backend Server).
