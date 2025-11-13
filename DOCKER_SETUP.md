# Hướng dẫn Docker Compose Setup

Tài liệu này hướng dẫn cách thiết lập và sử dụng Docker Compose cho dự án TusWhole.

## Tổng quan

Dự án hỗ trợ 2 môi trường:
- **Local Development**: Chạy trực tiếp trên máy với tự động load `.env_local`
- **Docker Compose**: Chạy trong container với 2 môi trường dev và prod

## 1. Chạy Local Development

### Backend

1. Tạo file `.env_local` từ template:
```bash
cd backend/environment
cp template/.env_local.template .env_local
```

2. Chỉnh sửa file `.env_local` theo nhu cầu

3. Chạy backend:
```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Backend sẽ tự động load biến môi trường từ `backend/environment/.env_local`.

### Frontend

1. Tạo file `.env_local` từ template:
```bash
cd frontend/environment
cp template/.env_local.template .env_local
```

2. Chỉnh sửa file `.env_local` theo nhu cầu

3. Chạy frontend:
```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ tự động copy file từ `frontend/environment/.env_local` sang `.env.local` ở root (thông qua script `predev`).

## 2. Chạy với Docker Compose

### Development

1. Tạo file biến môi trường:
```bash
cd deployment/environment
cp template/.env.dev.template .env.dev
```

2. Chỉnh sửa file `.env.dev` theo nhu cầu

3. Chạy services:
```bash
cd deployment
docker-compose -f docker-compose.dev.yml up -d
```

4. Xem logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

5. Dừng services:
```bash
docker-compose -f docker-compose.dev.yml down
```

**Tính năng:**
- Hot reload cho cả backend và frontend
- Source code được mount để chỉnh sửa trực tiếp
- Database PostgreSQL với volume persistence

### Production

1. Tạo file biến môi trường:
```bash
cd deployment/environment
cp template/.env.prod.template .env.prod
```

2. **QUAN TRỌNG**: Cập nhật các giá trị bảo mật trong `.env.prod`:
   - `POSTGRES_PASSWORD`: Đặt mật khẩu mạnh
   - `DJANGO_SECRET_KEY`: Tạo secret key mạnh
   - `DJANGO_ALLOWED_HOSTS`: Thêm domain của bạn
   - `NEXT_PUBLIC_API_URL`: URL API production

3. Build và chạy:
```bash
cd deployment
docker-compose -f docker-compose.prod.yml up -d --build
```

4. Kiểm tra logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Tính năng:**
- Build và optimize code
- Nginx reverse proxy
- Gunicorn cho backend (production-ready)
- Static files serving
- Database persistence

## 3. Cấu trúc File Environment

### Local Development
```
backend/
└── environment/
    ├── template/
    │   └── .env_local.template
    └── .env_local          # File này được load tự động

frontend/
└── environment/
    ├── template/
    │   └── .env_local.template
    └── .env_local          # File này được copy sang .env.local tự động
```

### Docker Compose
```
deployment/
└── environment/
    ├── template/
    │   ├── .env.dev.template
    │   └── .env.prod.template
    ├── .env.dev            # Cho docker-compose.dev.yml
    └── .env.prod            # Cho docker-compose.prod.yml
```

## 4. Các Lệnh Hữu Ích

### Development
```bash
# Xem logs tất cả services
docker-compose -f docker-compose.dev.yml logs -f

# Xem logs một service cụ thể
docker-compose -f docker-compose.dev.yml logs -f backend

# Rebuild một service
docker-compose -f docker-compose.dev.yml up -d --build backend

# Chạy migration
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Tạo superuser
docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# Vào shell của container
docker-compose -f docker-compose.dev.yml exec backend bash
```

### Production
```bash
# Xem logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart một service
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild và restart
docker-compose -f docker-compose.prod.yml up -d --build

# Backup database
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres tuswhole_prod > backup.sql
```

## 5. Troubleshooting

### Port đã được sử dụng
Nếu gặp lỗi port đã được sử dụng, thay đổi port trong file `.env.dev` hoặc `.env.prod`:
- `BACKEND_PORT`: Port cho backend
- `FRONTEND_PORT`: Port cho frontend
- `POSTGRES_PORT`: Port cho database
- `NGINX_HTTP_PORT`: Port HTTP cho nginx
- `NGINX_HTTPS_PORT`: Port HTTPS cho nginx

### Database connection error
Kiểm tra:
1. Database container đã chạy: `docker-compose ps`
2. Biến `DATABASE_URL` trong file env đúng
3. Database đã sẵn sàng: `docker-compose exec db pg_isready`

### Frontend không kết nối được backend
Kiểm tra:
1. `NEXT_PUBLIC_API_URL` trong file env đúng
2. Backend container đã chạy
3. CORS settings trong backend cho phép frontend origin

### Static files không load
Trong production, đảm bảo:
1. Nginx volume mount đúng: `backend_static_prod:/var/www/static`
2. Backend đã chạy `collectstatic`
3. Nginx config đúng path `/static/`

## 6. Security Notes

⚠️ **QUAN TRỌNG:**
- Không commit file `.env.dev`, `.env.prod`, `.env_local` vào git
- Đổi tất cả password mặc định trong production
- Sử dụng HTTPS trong production
- Cấu hình firewall và security groups phù hợp
- Backup database thường xuyên

## 7. Next Steps

Sau khi setup thành công:
1. Tạo superuser cho Django admin
2. Chạy migrations và seed data (nếu có)
3. Cấu hình SSL certificate cho HTTPS (production)
4. Setup monitoring và logging
5. Cấu hình backup tự động

