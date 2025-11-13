# Backend Environment Templates

Thư mục này chứa các file template cho environment variables của backend.

## Files

- `env_example` - Template cho môi trường local development
- `env.docker_example` - Template cho môi trường Docker

## Cách sử dụng

### Local Development

```bash
cd backend/environment
cp template/env_example .env
# Chỉnh sửa .env với các giá trị của bạn
```

### Docker

```bash
cd backend/environment
cp template/env.docker_example .env.docker
# Chỉnh sửa .env.docker với các giá trị của bạn
```

## Lưu ý

- Các file `.env` và `.env.docker` không được commit vào git
- Chỉ commit các file `*_example` trong thư mục `template/`

