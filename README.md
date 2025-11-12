# Dự án Django DRF với PostgreSQL và JWT

## Yêu cầu hệ thống

- Python 3.11+ (khuyến nghị 3.12 trở lên)
- PostgreSQL (nếu sử dụng cơ sở dữ liệu thật)

## Thiết lập môi trường

1. Tạo và kích hoạt môi trường ảo

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```

2. Cài đặt phụ thuộc

   ```powershell
   pip install -r requirements.txt
   ```

3. Sao chép file cấu hình môi trường

   ```powershell
   copy env.example .env
   ```

   Cập nhật các biến trong `.env` phù hợp với cấu hình của bạn.

## Biến môi trường chính

- `DJANGO_SECRET_KEY`: khoá bí mật của Django.
- `DJANGO_DEBUG`: `True/False` để bật/tắt chế độ debug.
- `DJANGO_ALLOWED_HOSTS`: danh sách host, phân tách bằng dấu phẩy.
- `DATABASE_URL`: chuỗi kết nối PostgreSQL theo chuẩn `postgresql://user:password@host:port/dbname`.

Nếu `DATABASE_URL` không được thiết lập, dự án sẽ tự động sử dụng SQLite cho môi trường phát triển.

## Cấu trúc chính

- `TusWhole/`: mã nguồn project Django (settings, urls, wsgi/asgi).
- `app/`: thư mục chứa các Django app, ví dụ `app/api`.
- `app/finance/`: quản lý ví, giao dịch và nhóm danh mục thu chi.
- `env.example`: mẫu biến môi trường.
- `requirements.txt`: danh sách phụ thuộc Python.

## Ứng dụng quản lý thu chi

- `Wallet`: mỗi người dùng có thể sở hữu nhiều ví với tiền tệ, số dư ban đầu và hiện tại.
- `Category` và `CategoryTemplate`: nhóm giao dịch theo loại (thu/chi/cho vay/đi vay). `CategoryTemplate` là bộ master để gợi ý khi tạo ví mới.
- `Transaction`: ghi nhận giao dịch theo từng ví, liên kết nhóm, lưu số tiền, ghi chú, thời điểm phát sinh và metadata tuỳ chọn.

### API chính

- `GET /api/finance/wallets/`: danh sách ví của người dùng.
- `POST /api/finance/wallets/`: tạo ví mới (`copy_master=true/false` để sao chép master categories).
- `GET /api/finance/categories/?wallet=<id>`: danh sách category của ví.
- `GET /api/finance/category-templates/`: danh sách master categories để gợi ý.
- `GET /api/finance/transactions/?wallet=<id>`: danh sách giao dịch theo ví.

Tất cả endpoints yêu cầu xác thực JWT (sử dụng các endpoint `/api/token/`).

## Di chuyển cơ sở dữ liệu

```powershell
python manage.py migrate
```

## Seed dữ liệu mẫu

```powershell
python manage.py seed_finance
```

- Tạo người dùng demo: `demo / demo1234`.
- Sinh master categories, ví mặc định và một vài giao dịch mẫu.

## Chạy dự án

```powershell
python manage.py runserver
```

## Endpoints JWT mặc định

- `POST /api/token/`: lấy access token và refresh token.
- `POST /api/token/refresh/`: làm mới access token.
- `POST /api/token/verify/`: kiểm tra tính hợp lệ của access token.

> Endpoint `/api/token/` trả về thêm thông tin người dùng và thời gian hết hạn của từng token.

## Tài liệu API (Swagger/Redoc)

- `GET /api/schema/`: xuất file schema OpenAPI (JSON).
- `GET /api/docs/`: giao diện Swagger UI để thử nghiệm API.
- `GET /api/redoc/`: giao diện Redoc để xem tài liệu API.

## Kiểm tra nhanh

- `GET /api/health/`: kiểm tra tình trạng dịch vụ (không yêu cầu xác thực).
