# Coding Guidelines & Standards

Tài liệu này quy định các tiêu chuẩn viết code cho toàn bộ dự án Web GIS để đảm bảo tính nhất quán và dễ bảo trì.

## 1. Format & Linting
- **Prettier:** Dùng Prettier để format code. Chạy tự động khi lưu (Format on Save).
- **ESLint:** Bắt buộc tuân thủ các rules mặc định của `eslint:recommended` và `plugin:@typescript-eslint/recommended`.
- **Git Hooks (Husky + lint-staged):** Không cho phép commit nếu code chưa pass ESLint và Prettier.

## 2. Naming Conventions (Quy tắc đặt tên)
- **Tên File Component React:** `PascalCase.tsx` (VD: `ProjectCard.tsx`).
- **Tên Hàm/Biến (JS/TS):** `camelCase` (VD: `fetchProjectData`, `isActive`).
- **Tên Class (CSS/SCSS):** `kebab-case` (VD: `project-card-container`). Đề xuất dùng Tailwind để bỏ qua việc đặt tên class thủ công.
- **Tên Hằng số (Constants):** `UPPER_SNAKE_CASE` (VD: `MAX_FILE_SIZE`).
- **Tên Bảng Database:** `snake_case`, số nhiều (VD: `users`, `projects`).

## 3. TypeScript Guidelines
- **LUÔN LUÔN** định nghĩa kiểu dữ liệu. Không dùng `any`. Nếu chưa biết kiểu, dùng `unknown`.
- Ưu tiên dùng `interface` cho khai báo cấu trúc Object, `type` cho các union types hoặc primitives.

```typescript
// Tốt
interface User {
  id: string;
  name: string;
}

// Xấu
const processUser = (user: any) => { ... }
```

## 4. React Best Practices
- Không khai báo inline function trong `render` nếu function đó nặng hoặc truyền xuống child component. Dùng `useCallback`.
- Tách UI Logic (Giao diện) và Business Logic (Gọi API, xử lý dữ liệu). Business logic nên đặt trong Custom Hooks.

```tsx
// Custom Hook
const { projects, isLoading } = useProjects();

// UI Component
return (
  <div>
    {isLoading ? <Spinner /> : projects.map(p => <ProjectCard key={p.id} project={p} />)}
  </div>
);
```

## 5. Git & Workflow
Sử dụng **Trunk Based Development** hoặc **Git Flow** đơn giản.

### Conventional Commits
Tin nhắn commit phải theo chuẩn: `type(scope): subject`
- `feat`: Tính năng mới (VD: `feat(viewer): thêm công cụ đo thể tích`)
- `fix`: Sửa lỗi (VD: `fix(auth): sửa lỗi crash khi token hết hạn`)
- `refactor`: Viết lại code nhưng không đổi logic (VD: `refactor(ui): tách component Header`)
- `docs`: Cập nhật tài liệu (VD: `docs: cập nhật README`)
- `chore`: Tác vụ vặt, không sửa source code (cập nhật thư viện, config).
