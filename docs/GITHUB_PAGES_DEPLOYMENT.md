# Hướng dẫn Triển khai Web Frontend lên GitHub Pages

Tài liệu này hướng dẫn chi tiết cách deploy ứng dụng Web Frontend (React + Vite + Cesium) từ thư mục `web-gis-platform/apps/web` lên **GitHub Pages**.

Vì dự án của bạn nằm trong cấu trúc monorepo và sử dụng React Router, có 3 vấn đề kỹ thuật lớn cần xử lý trước khi deploy:
1. **API Backend**: GitHub Pages chỉ host được trang tĩnh (Frontend). Bạn phải trỏ API từ `localhost` sang server API thật của bạn (ví dụ đã deploy trên Render/VPS).
2. **Asset Path (Base URL)**: GitHub Pages lưu trang của bạn dưới subpath `/3dmappingwebsite/`, do đó cần cấu hình `base` trong Vite.
3. **Router 404**: Cần đổi sang `HashRouter` để không bị lỗi 404 khi tải lại trang (F5).

---

## Bước 1: Thay thế các URL API kết nối Backend (Rất quan trọng)
Hiện tại trong code frontend của bạn đang bị fix cứng địa chỉ `http://localhost:3000` ở nhiều file (như `services/api.ts`, `useAuthStore.ts`, `LoginPage.tsx`, `RegisterPage.tsx`, `DashboardPage.tsx`...).

Khi chạy trên GitHub Pages, trình duyệt của người dùng không thể gọi tới `localhost:3000` trên máy họ được.
1. Triển khai API Backend của bạn lên host (Render, Railway, VPS...). Giả sử bạn có link API là: `https://api.yourdomain.com`.
2. Thay thế tất cả các chuỗi `'http://localhost:3000'` trong thư mục `apps/web/src` thành link API production của bạn. 
   *(Khuyên dùng: Định nghĩa một biến môi trường `import.meta.env.VITE_API_URL` hoặc biến hằng số dùng chung trong file `api.ts` để sau này đổi cấu hình dễ dàng).*

---

## Bước 2: Cấu hình `base` trong `vite.config.ts`

Vì tên repo của bạn là `3dmappingwebsite`, đường dẫn URL trên GitHub Pages sẽ là `https://duonganh2804.github.io/3dmappingwebsite/`. Cần cấu hình Vite để import đúng các file JS/CSS.

Mở file [vite.config.ts](file:///c:/Users/duong/Web%20GIS/web-gis-platform/apps/web/vite.config.ts) và thêm trường `base` như sau:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/3dmappingwebsite/', // <-- THÊM DÒNG NÀY (Trùng với tên Repo Github của bạn)
  plugins: [
    react(),
    tailwindcss(),
    typeof cesium === 'function' ? (cesium as any)() : (cesium as any).default()
  ],
})
```

---

## Bước 3: Đổi từ `BrowserRouter` sang `HashRouter`

GitHub Pages không hỗ trợ cấu hình Rewrite URL cho Single Page Application (SPA). Nếu giữ nguyên `BrowserRouter`, khi người dùng truy cập trực tiếp hoặc bấm F5 tải lại trang ở đường dẫn con (ví dụ: `/dashboard`), GitHub sẽ báo lỗi 404.

Mở file [web-gis-platform/apps/web/src/App.tsx](file:///c:/Users/duong/Web%20GIS/web-gis-platform/apps/web/src/App.tsx) và đổi sang `HashRouter`:

1. Thay đổi dòng import:
   ```typescript
   // Trước:
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
   // Sau:
   import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
   ```
2. Thay thế thẻ bọc ngoài cùng của router trong component `App`:
   ```tsx
   // Trước:
   <BrowserRouter>
     ...
   </BrowserRouter>

   // Sau:
   <HashRouter>
     ...
   </HashRouter>
   ```

---

## Bước 4: Cài đặt và cấu hình script deploy `gh-pages`

Ta sử dụng gói `gh-pages` để đẩy nhanh thư mục build tĩnh lên nhánh deploy của Github.

1. Mở Terminal và di chuyển vào thư mục Frontend:
   ```bash
   cd web-gis-platform/apps/web
   ```
2. Cài đặt thư viện:
   ```bash
   npm install gh-pages --save-dev
   ```
3. Mở file [package.json](file:///c:/Users/duong/Web%20GIS/web-gis-platform/apps/web/package.json) và thêm hai dòng script sau vào khối `"scripts"`:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "tsc -b && vite build",
     "lint": "oxlint",
     "preview": "vite preview",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

---

## Bước 5: Thực hiện Deploy

Từ thư mục `web-gis-platform/apps/web`, bạn chạy lệnh sau trên Terminal:

```bash
npm run deploy
```

**Quá trình tự động diễn ra:**
1. Lệnh `predeploy` kích hoạt -> chạy `npm run build` để biên dịch code React + Cesium ra thư mục tĩnh `/dist`.
2. Lệnh `deploy` kích hoạt -> đẩy toàn bộ nội dung trong thư mục `/dist` lên một nhánh mới trên Github tên là **`gh-pages`**.

---

## Bước 6: Bật GitHub Pages trên GitHub Dashboard

1. Mở trình duyệt, truy cập vào trang Github chứa Repository **`3dmappingwebsite`** của bạn.
2. Chọn tab **Settings** (Cài đặt) ở thanh ngang phía trên của repository.
3. Chọn mục **Pages** ở danh mục menu bên trái.
4. Tại phần **Build and deployment**:
   - **Source**: Chọn `Deploy from a branch`.
   - **Branch**: Chọn nhánh **`gh-pages`** và thư mục là **`/(root)`**.
5. Bấm **Save** (Lưu).

Sau khoảng 1 - 2 phút, GitHub sẽ hiển thị đường link trang web đã deploy của bạn ở phía trên đầu trang cài đặt Pages, ví dụ: `https://duonganh2804.github.io/3dmappingwebsite/`.
