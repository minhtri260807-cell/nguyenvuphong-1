# Nguyễn Vũ Phong Website Backend

Backend Node/Express đã được cấu hình để:
- Lưu liên hệ vào SQLite (`contacts.db`)
- Gửi email thông báo khi SMTP được cấu hình
- Phục vụ frontend tĩnh từ cùng thư mục

## Cài đặt

```sh
cd /Users/macbookprom2/phong
npm install
```

## Cấu hình SMTP

Sao chép `.env.example` thành `.env` và cập nhật các giá trị:

```sh
cp .env.example .env
```

Sau đó chỉnh các biến:
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE` (true hoặc false)
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `EMAIL_TO`
- `ADMIN_API_KEY`

## Chạy server

```sh
npm start
```

Trang sẽ chạy trên `http://localhost:3000` (hoặc cổng khác nếu `PORT` được đặt).

## API

- `POST /api/contact` — nhận dữ liệu form và lưu vào SQLite
- `GET /api/contacts?key=YOUR_ADMIN_KEY` — xem danh sách liên hệ (yêu cầu khóa quản trị)

## Deploy

Dự án này đã sẵn sàng để deploy lên dịch vụ Node.js như Render hoặc Railway.
Xem thêm hướng dẫn chi tiết trong `DEPLOYMENT.md`.

## Lưu ý

Nếu SMTP chưa cấu hình, form vẫn lưu được vào database nhưng email sẽ không gửi.
