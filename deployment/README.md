# Docker Compose Deployment

Thư mục này chứa các file cấu hình Docker Compose cho việc triển khai dự án TusWhole.

## Cấu trúc

```
deployment/
├── docker-compose.dev.yml      # Docker Compose cho môi trường development
├── docker-compose.prod.yml     # Docker Compose cho môi trường production
├── nginx/                      # Cấu hình Nginx
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
└── environment/                # Biến môi trường
    ├── .env.dev               # Biến môi trường cho dev (tạo từ template)
    ├── .env.prod              # Biến môi trường cho prod (tạo từ template)
    └── template/              # Template cho biến môi trường
        ├── .env.dev.template
        └── .env.prod.template
```

## Thiết lập ban đầu

### 1. Tạo file biến môi trường

Sao chép các file template thành file thực tế:

```bash
# Development
cp deployment/environment/template/.env.dev.template deployment/environment/.env.dev

# Production
cp deployment/environment/template/.env.prod.template deployment/environment/.env.prod
```

Sau đó chỉnh sửa các giá trị trong file `.env.dev` và `.env.prod` theo nhu cầu của bạn.

### 2. Chạy Development

```bash
cd deployment
docker-compose -f docker-compose.dev.yml up -d
```

Các service sẽ chạy tại:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: localhost:5432

### 3. Chạy Production

```bash
cd deployment
docker-compose -f docker-compose.prod.yml up -d --build
```

Các service sẽ chạy qua Nginx tại:
- HTTP: http://localhost:80
- HTTPS: https://localhost:443 (nếu đã cấu hình SSL)

## Tính năng

### Development (docker-compose.dev.yml)
- ✅ Hot reload cho backend và frontend
- ✅ Mount source code để chỉnh sửa trực tiếp
- ✅ PostgreSQL database với volume persistence
- ✅ Tự động migrate database khi khởi động

### Production (docker-compose.prod.yml)
- ✅ Build và optimize code
- ✅ Nginx reverse proxy
- ✅ Static files serving
- ✅ Production-ready configuration
- ✅ Database persistence với volumes

## Lệnh hữu ích

```bash
# Xem logs
docker-compose -f docker-compose.dev.yml logs -f

# Dừng services
docker-compose -f docker-compose.dev.yml down

# Rebuild và restart
docker-compose -f docker-compose.dev.yml up -d --build

# Xem status
docker-compose -f docker-compose.dev.yml ps

# Chạy migration (backend)
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Tạo superuser (backend)
docker-compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

## Lưu ý

1. **Database**: Dữ liệu database được lưu trong Docker volumes, sẽ không mất khi restart container.

2. **Environment Variables**: Luôn kiểm tra và cập nhật các biến môi trường trong file `.env.dev` và `.env.prod` trước khi deploy.

3. **Security**: 
   - Đổi các password mặc định trong production
   - Sử dụng HTTPS trong production
   - Không commit file `.env.dev` và `.env.prod` vào git

4. **Ports**: Đảm bảo các port không bị conflict với các service khác trên máy.

