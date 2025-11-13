# Frontend Environment Templates

Thư mục này chứa các file template cho environment variables của frontend.

## Files

- `env_example` - Template cho môi trường local development
- `env.docker_example` - Template cho môi trường Docker

## Cách sử dụng

### Local Development

```bash
cd frontend/environment
cp template/env_example .env
# Chỉnh sửa .env với các giá trị của bạn
```

Sau đó copy file `.env` sang `frontend/.env.local` (Next.js yêu cầu file ở trong thư mục frontend):

```bash
cp frontend/environment/.env frontend/.env.local
```

### Docker

```bash
cd frontend/environment
cp template/env.docker_example .env.docker
# Chỉnh sửa .env.docker với các giá trị của bạn
```

## Lưu ý

- Các file `.env` và `.env.docker` không được commit vào git
- Chỉ commit các file `*_example` trong thư mục `template/`
- Next.js yêu cầu file `.env.local` phải ở trong thư mục `frontend/`, không phải trong `environment/`

