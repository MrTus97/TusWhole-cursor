#!/usr/bin/env node
/**
 * Script để tự động load .env_local từ frontend/environment/.env_local
 * và copy vào .env.local ở root của frontend để Next.js có thể đọc
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', 'environment', '.env_local');
const envLocalTargetPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envLocalPath)) {
  fs.copyFileSync(envLocalPath, envLocalTargetPath);
  console.log('✓ Đã load .env_local từ frontend/environment/.env_local');
} else {
  console.warn('⚠ Không tìm thấy file frontend/environment/.env_local');
  console.warn('  Tạo file .env.local từ template nếu cần');
}

