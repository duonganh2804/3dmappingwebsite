# Frontend Developer Guide

## 1. Stack Technology
- **Framework:** React 18
- **Build Tool:** Vite (nhanh hơn Webpack)
- **Language:** TypeScript (Bắt buộc dùng Strict Mode)
- **Routing:** React Router v6
- **Styling:** TailwindCSS + CSS Modules (Cho các component cần style đặc thù không làm được bằng utility classes).
- **Icons:** Lucide React hoặc Phosphor Icons.
- **Data Fetching:** React Query (TanStack Query) cho API state management, cache, và retry logic.

## 2. Component Architecture (Atomic Design)
Thư mục `src/components` được chia thành các cấp độ:
- **atoms:** Button, Input, Spinner, Icon (Các UI elements cơ bản nhất).
- **molecules:** SearchBar, Dropdown, Menu (Tổ hợp từ nhiều atoms).
- **organisms:** Header, Sidebar, MapToolbar (Các khối độc lập có chứa business logic).
- **templates:** Layouts cho trang (DashboardLayout, ViewerLayout).

## 3. Best Practices cho 3D/CesiumJS trong React
- **Không đặt đối tượng `viewer` của Cesium vào React State (useState/Redux).** Cesium Viewer object rất lớn và bị mutate liên tục bởi WebGL loop, nếu cho vào React State sẽ gây memory leak hoặc re-render vô tận. Hãy giữ nó trong một `useRef` hoặc bên ngoài React Tree (dùng Zustand dạng no-store).
- Hạn chế tối đa Re-render ở các component bọc ngoài Map. Sử dụng `React.memo` và `useCallback`.

## 4. Error Handling
- Bọc toàn bộ App (hoặc các Route chính) bằng `ErrorBoundary` để nếu có lỗi JS (ví dụ Cesium crash), trang không bị trắng mà sẽ hiện giao diện fallback (thông báo lỗi và nút Reload).
- Bắt lỗi API bằng Axios Interceptors và hiện Toast Notification (dùng `react-hot-toast`).
