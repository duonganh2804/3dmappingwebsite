# Hướng dẫn thiết lập Đăng nhập bằng Google (Google OAuth 2.0)

Hệ thống Web GIS đã được tích hợp sẵn chức năng đăng nhập bằng Google trên cả Frontend (sử dụng thư viện `@react-oauth/google`) và Backend (sử dụng `google-auth-library`). 

Để thiết lập và sử dụng Google Sign-In của riêng bạn, hãy làm theo các bước hướng dẫn chi tiết dưới đây.

---

## Bước 1: Tạo OAuth Client ID trên Google Cloud Console

1. **Truy cập Google Cloud Console**:
   * Truy cập vào trang [Google Cloud Console](https://console.cloud.google.com/).
   * Đăng nhập bằng tài khoản Google của bạn.

2. **Tạo hoặc Chọn Dự án (Project)**:
   * Nhấp vào menu chọn dự án ở góc trên bên trái, chọn **New Project** (Dự án mới) nếu bạn chưa có dự án, hoặc chọn một dự án hiện có.

3. **Cấu hình Google Auth Platform (Màn hình đồng ý OAuth)**:
   * Từ giao diện **Google Auth Platform** (như trong ảnh chụp màn hình của bạn), nhấp vào nút xanh **`First steps`** ở giữa màn hình (hoặc chọn **`Branding`** ở menu bên trái).
   * Điền các thông tin ứng dụng của bạn:
     * **App name**: Ví dụ: *SaolaGIS* hoặc *Web GIS Platform*.
     * **User support email**: Chọn email của bạn trong danh sách.
     * **Developer contact information**: Nhập email của bạn.
   * Nhấp **Save and Continue** qua các bước tiếp theo.
   * Ở bước **`Audience`** (Đối tượng), chọn **External** (Ngoại bộ) và thêm địa chỉ email Gmail kiểm thử của bạn vào danh sách **Test users** (đây là bước bắt buộc để bạn có thể đăng nhập thử nghiệm khi ứng dụng chưa công khai).

4. **Tạo mã Client ID (Identifiers)**:
   * Di chuột hoặc nhấp vào mục **`APIs and services`** ở menu chính phía bên trái -> Chọn **`Identifiers`** (dòng thứ 3 từ trên xuống).
   * Nhấp vào nút **`+ Create Credentials`** (hoặc **`Create client`**) ở phía trên cùng -> Chọn **`OAuth client ID`**.
   * Cấu hình các thông tin như sau:
     * **Application type** (Loại ứng dụng): Chọn **Web application** (Ứng dụng Web).
     * **Name** (Tên): Ví dụ: *SaolaGIS Web Client*.
     * **Authorized JavaScript origins** (Nguồn gốc JavaScript được ủy quyền): Nhấp vào **+ Add URI** và điền:
       * Khi phát triển ở máy cá nhân (Local): `http://localhost:5173`
       * Khi chạy production (Deploy): `https://threedmappingwebsite.onrender.com`
     * **Authorized redirect URIs** (URI chuyển hướng được ủy quyền):
       * *Lưu ý*: Do hệ thống sử dụng phương thức đăng nhập Client-Side nhận `idToken` và gửi API trực tiếp về backend, bạn không cần cấu hình Redirect URIs phức tạp. Tuy nhiên, để đảm bảo bảo mật và tương thích tốt, bạn có thể thêm:
         * `http://localhost:5173`
         * `https://threedmappingwebsite.onrender.com`
   * Nhấp **Create**.
   * Một hộp thoại xuất hiện hiển thị **Your Client ID**. Hãy sao chép **Client ID** này (có dạng `xxxxxx-xxxxxx.apps.googleusercontent.com`).

---

## Bước 2: Cấu hình biến môi trường (Environment Variables)

Sau khi có Client ID từ Google Cloud Console, bạn cần cập nhật Client ID này vào cấu hình của cả Backend và Frontend.

### 1. Cấu hình Backend (`apps/api`)
Mở file `.env` ở thư mục `web-gis-platform/apps/api/.env` (hoặc tạo từ `.env.example`) và điền Client ID của bạn vào:

```env
# ── Google OAuth ──
GOOGLE_CLIENT_ID="MÃ_CLIENT_ID_GOOGLE_CỦA_BẠN.apps.googleusercontent.com"
```

### 2. Cấu hình Frontend (`apps/web`)
Mở các file cấu hình môi trường của Frontend và thêm biến `VITE_GOOGLE_CLIENT_ID`:

* **Khi chạy local (Development)**: Sửa file `web-gis-platform/apps/web/.env.development`:
  ```env
  VITE_API_URL=http://localhost:3000/api
  VITE_GOOGLE_CLIENT_ID="MÃ_CLIENT_ID_GOOGLE_CỦA_BẠN.apps.googleusercontent.com"
  ```

* **Khi triển khai thật (Production)**: Sửa file `web-gis-platform/apps/web/.env.production`:
  ```env
  VITE_API_URL=https://threedmappingwebsite.onrender.com/api
  VITE_GOOGLE_CLIENT_ID="MÃ_CLIENT_ID_GOOGLE_CỦA_BẠN.apps.googleusercontent.com"
  ```

---

## Bước 3: Khởi động lại ứng dụng và Thử nghiệm

1. **Khởi động lại Server**:
   * Tắt và chạy lại Backend (`npm run dev` hoặc lệnh khởi chạy API tương ứng).
   * Tắt và chạy lại Frontend (`npm run dev`).

2. **Thử nghiệm Đăng nhập**:
   * Truy cập trang Đăng nhập (`http://localhost:5173/login`).
   * Bạn sẽ thấy nút đăng nhập **Sign in with Google**.
   * Nhấp vào nút đó, chọn tài khoản Google của bạn.
   * Hệ thống sẽ tự động đồng bộ hóa thông tin tài khoản (Email, Họ tên, Ảnh đại diện) và đăng nhập bạn vào trang Dashboard.

---

> **Lưu ý quan trọng**:
> * Trong quá trình phát triển (khi dự án ở trạng thái **Testing** trong Google Cloud), chỉ những email được liệt kê trong danh sách **Test users** của màn hình đồng ý OAuth mới có thể đăng nhập được.
> * Khi đưa dự án lên chạy chính thức, hãy đổi trạng thái dự án sang **In Production** ở màn hình đồng ý OAuth trên Google Cloud Console để tất cả người dùng đều có thể sử dụng.
