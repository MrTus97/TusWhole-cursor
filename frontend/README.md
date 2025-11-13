# Frontend - TusWhole

Frontend application được xây dựng với Next.js 16, TypeScript, Tailwind CSS và shadcn/ui.

## Yêu cầu

- Node.js 18+ 
- npm hoặc yarn

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Cấu trúc

- `app/` - Next.js App Router
  - `login/` - Trang đăng nhập
  - `(dashboard)/` - Dashboard layout với navigation
    - `finance/` - Module quản lý tài chính
      - `wallets/` - Quản lý ví
      - `transactions/` - Quản lý giao dịch
  - `journal/` - Module ghi nhật ký rich-text với CKEditor
- `components/` - React components
  - `ui/` - shadcn/ui components
- `components/rich-text-editor.tsx` - Wrapper CKEditor cho Next.js
- `lib/` - Utilities
  - `api.ts` - API client
  - `auth.tsx` - Auth context

## Tính năng

- ✅ Đăng nhập với JWT
- ✅ Quản lý ví (tạo, xem, xóa)
- ✅ Quản lý giao dịch (tạo, xem, xóa)
- ✅ Ghi nhật ký với CKEditor (bảng, chèn ảnh, lọc theo hashtag)
- ✅ Tự động refresh token
- ✅ Protected routes
