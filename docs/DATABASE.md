# Database Architecture (PostgreSQL + PostGIS) - Detailed Version

## 1. Công nghệ & Môi trường
- **RDBMS:** PostgreSQL 15+
- **Extension:** PostGIS 3.3+ (Dùng để xử lý tọa độ, không gian 3D). Bắt buộc phải chạy `CREATE EXTENSION postgis;` trên database.
- **ORM Khuyến nghị:** Prisma (bởi vì Type-safety với TypeScript rất tốt).

## 2. Prisma Schema Chi tiết (`schema.prisma`)

Dưới đây là thiết kế chi tiết các bảng, trường dữ liệu, kiểu dữ liệu và các ràng buộc (Constraints) phục vụ cho Web GIS.

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis(version: "3.3.2")] // Enable PostGIS
}

// ------------------------------------------------------
// ENUMS
// ------------------------------------------------------
enum Role {
  SUPER_ADMIN
  WORKSPACE_OWNER
  EDITOR
  VIEWER
}

enum LayerType {
  CESIUM_3D_TILES    // Dành cho OSGB, OBJ đã convert
  CLOUD_OPT_GEOTIFF  // Dành cho ảnh DOM (.tif) dạng COG
  WMS                // Web Map Service
  GEOJSON            // Dữ liệu Vector
  POINT_CLOUD_EPT    // Entwine Point Tile (Potree)
}

enum MeasurementType {
  POINT              // Đánh dấu điểm
  DISTANCE           // Đo khoảng cách (Polyline)
  AREA               // Đo diện tích (Polygon)
  VOLUME             // Đo thể tích (Polygon/Mesh)
  PROFILE            // Cắt mặt cắt
}

// ------------------------------------------------------
// MODELS
// ------------------------------------------------------

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique @db.VarChar(255)
  passwordHash  String    @map("password_hash")
  fullName      String?   @map("full_name") @db.VarChar(100)
  role          Role      @default(VIEWER)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Quan hệ
  workspaces    Workspace[]
  measurements  Measurement[]

  @@map("users")
}

model Workspace {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ownerId     String   @map("owner_id") @db.Uuid
  name        String   @db.VarChar(255)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Quan hệ
  owner       User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  projects    Project[]

  @@map("workspaces")
}

model Project {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workspaceId   String    @map("workspace_id") @db.Uuid
  name          String    @db.VarChar(255) // VD: "Vườn Ươm 26/06"
  description   String?   @db.Text
  captureDate   DateTime? @map("capture_date")
  thumbnailUrl  String?   @map("thumbnail_url") @db.Text
  
  // POSTGIS: Lưu tọa độ trung tâm để khi mở dự án, Camera tự bay tới đây.
  // Kiểu dữ liệu không hỗ trợ native trong Prisma, ta dùng Unsupported
  centerPoint   Unsupported("geometry(PointZ, 4326)")? @map("center_point")
  
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Quan hệ
  workspace     Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  layers        Layer[]
  measurements  Measurement[]

  @@index([workspaceId])
  @@map("projects")
}

model Layer {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId         String    @map("project_id") @db.Uuid
  name              String    @db.VarChar(255) // VD: "Mô hình 3D Mesh", "Ảnh Trực Giao"
  type              LayerType
  
  // Đường dẫn tới dữ liệu. Ví dụ: s3://my-bucket/processed/vuon-uom/tileset.json
  dataUrl           String    @map("data_url") @db.Text 
  
  // Cấu hình hiển thị (opacity mặc định, màu sắc...)
  displayConfig     Json?     @map("display_config") @db.JsonB 
  
  isVisibleByDefault Boolean  @default(true) @map("is_visible_by_default")
  createdAt         DateTime  @default(now()) @map("created_at")

  // Quan hệ
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("layers")
}

model Measurement {
  id          String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId   String          @map("project_id") @db.Uuid
  userId      String          @map("user_id") @db.Uuid
  type        MeasurementType
  
  name        String?         @db.VarChar(255) // Tên của nét vẽ (VD: "Đoạn đường số 1")
  
  // Giá trị tính toán được (Ví dụ: 125.5 mét, hoặc 450 m2)
  value       Float?          
  
  // POSTGIS: Lưu mảng tọa độ 3D của nét vẽ.
  geom        Unsupported("geometry(GeometryZ, 4326)") 
  
  // Lưu style nét vẽ (màu sắc, độ dày)
  properties  Json?           @db.JsonB
  
  createdAt   DateTime        @default(now()) @map("created_at")

  // Quan hệ
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@map("measurements")
}
```

## 3. SQL Raw Scripts (Cho PostGIS Indexes)

Do Prisma không hỗ trợ native việc tạo Spatial Index cho các cột PostGIS, sau khi chạy `npx prisma db push` hoặc `migrate`, bạn phải chạy các lệnh SQL thủ công sau trong Database để tối ưu tốc độ truy vấn trên bản đồ:

```sql
-- Tạo Spatial Index cho cột center_point của bảng projects
CREATE INDEX idx_projects_center_point ON projects USING GIST (center_point);

-- Tạo Spatial Index cho các nét vẽ đo đạc
CREATE INDEX idx_measurements_geom ON measurements USING GIST (geom);

-- Tạo Index trên các trường JSONB để tìm kiếm nhanh cấu hình (nếu cần)
CREATE INDEX idx_layers_display_config ON layers USING GIN (display_config);
```

## 4. Giải thích thêm về Thiết kế
1. **Multi-Tenant (Workspace):** Thiết kế này cho phép 1 công ty tạo 1 Workspace, trong Workspace có nhiều Project (Vườn Ươm, Khu Công Nghiệp X). Users được gán vào Workspace thay vì gán trực tiếp vào Project.
2. **Layer Type:** Tách biệt rõ ràng DataUrl và Type. Khi Frontend gọi API lấy Layers, dựa vào biến `type`, Frontend sẽ quyết định dùng hàm nào của Cesium để render (Dùng `Cesium3DTileset` cho `CESIUM_3D_TILES`, dùng `WebMapTileServiceImageryProvider` cho ảnh COG).
3. **Geometry(GeometryZ, 4326):** Dữ liệu không gian được lưu dưới tọa độ hệ WGS84 (EPSG:4326) có kèm giá trị độ cao (Z). Điều này là bắt buộc cho 3D GIS vì đo khoảng cách trên địa hình đồi núi phụ thuộc rất lớn vào trục Z.
