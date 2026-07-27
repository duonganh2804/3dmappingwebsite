# Project Structure (Monorepo)

Kiến trúc Monorepo (dùng **Turborepo** hoặc **Nx**) giúp quản lý cả Frontend và Backend trong cùng một repository, dễ dàng chia sẻ Types (TypeScript interfaces) giữa Client và Server.

```text
web-gis-workspace/
├── apps/
│   ├── api/                   # Backend Application (NestJS / Express)
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                   # Frontend Application (React + Vite)
│       ├── public/            # Static assets (images, favicon)
│       ├── src/
│       │   ├── api/           # API fetch functions (Axios/React Query)
│       │   ├── components/    # Reusable UI components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── layouts/       # Page layouts
│       │   ├── pages/         # Route components (Dashboard, Viewer)
│       │   ├── store/         # Zustand global state
│       │   ├── types/         # Local TS types
│       │   ├── utils/         # Helper functions (math, formatting)
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
│
├── packages/
│   ├── shared-types/          # TS Interfaces chia sẻ giữa web và api (Ví dụ: ProjectDTO)
│   │   ├── index.ts
│   │   └── package.json
│   ├── eslint-config-custom/  # Cấu hình ESLint chung cho cả team
│   └── tsconfig/              # Cấu hình TypeScript base
│
├── docs/                      # Tài liệu hệ thống (các file .md này)
├── package.json               # Monorepo root package.json
├── turbo.json                 # Cấu hình Turborepo
└── README.md
```

Lợi ích của cấu trúc này:
- Chạy `npm run dev` ở root sẽ bật cả frontend và backend.
- Đảm bảo Backend trả về object gì thì Frontend biết rõ kiểu dữ liệu đó nhờ `shared-types`.
