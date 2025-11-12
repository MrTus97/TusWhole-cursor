# TusWhole - Hệ thống quản lý tài chính cá nhân

Dự án full-stack quản lý thu chi cá nhân tương tự Money Lover, được xây dựng với Django DRF (backend) và Next.js (frontend).

## Cấu trúc dự án

```
.
├── backend/          # Django DRF Backend
│   ├── app/          # Django apps
│   │   ├── api/      # API utilities
│   │   └── finance/  # Module quản lý tài chính
│   └── TusWhole/     # Django project settings
└── frontend/         # Next.js Frontend
    ├── app/          # Next.js App Router
    └── components/   # React components
```

## Backend (Django DRF)

### Yêu cầu

- Python 3.11+
- PostgreSQL (tùy chọn, mặc định dùng SQLite)

### Cài đặt

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Cấu hình

Sao chép `env.example` thành `.env` và cập nhật các biến:

```bash
copy env.example .env
```

### Chạy backend

```bash
cd backend
python manage.py migrate
python manage.py seed_finance  # Tạo dữ liệu mẫu
python manage.py runserver
```

Backend chạy tại `http://localhost:8000`

### API Documentation

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

### Tài khoản demo

- Username: `demo`
- Password: `demo1234`

## Frontend (Next.js)

### Yêu cầu

- Node.js 18+
- npm hoặc yarn

### Cài đặt

```bash
cd frontend
npm install
```

### Cấu hình

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Chạy frontend

```bash
cd frontend
npm run dev
```

Frontend chạy tại `http://localhost:3000`

## Tính năng

### Backend

- ✅ JWT Authentication
- ✅ Quản lý ví (Wallet)
- ✅ Quản lý giao dịch (Transaction) với 4 loại: Thu, Chi, Cho vay, Đi vay
- ✅ Quản lý danh mục (Category) với cấu trúc phân cấp
- ✅ Master Category Templates để gợi ý khi tạo ví
- ✅ Filter, Search, Ordering tự động
- ✅ Swagger/OpenAPI documentation
- ✅ Cấu trúc code theo pattern: Models → Repositories → Services → Views

### Frontend

- ✅ Đăng nhập với JWT
- ✅ Quản lý ví (tạo, xem, xóa)
- ✅ Quản lý giao dịch (tạo, xem, xóa)
- ✅ Tự động refresh token
- ✅ Protected routes
- ✅ UI với shadcn/ui components

## API Endpoints chính

### Authentication
- `POST /api/token/` - Đăng nhập, lấy JWT token
- `POST /api/token/refresh/` - Làm mới access token
- `POST /api/token/verify/` - Xác thực token

### Finance
- `GET /api/finance/wallets/` - Danh sách ví
- `POST /api/finance/wallets/` - Tạo ví mới
- `GET /api/finance/transactions/` - Danh sách giao dịch
- `POST /api/finance/transactions/` - Tạo giao dịch mới
- `GET /api/finance/categories/` - Danh sách danh mục
- `GET /api/finance/category-templates/` - Danh sách master categories

Tất cả endpoints hỗ trợ filter, search và ordering. Xem Swagger UI để biết chi tiết.

## Phát triển

### Backend

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm run dev
```

## License

MIT

