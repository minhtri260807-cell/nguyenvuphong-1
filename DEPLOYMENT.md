# Hướng dẫn triển khai dự án

Tài liệu này hướng dẫn bạn deploy website Node.js của bạn lên Render, Railway hoặc VPS riêng.

> Lưu ý: hiện tại dự án dùng SQLite (`contacts.db`) để lưu liên hệ. Trên các dịch vụ cloud, file `contacts.db` có thể bị mất khi deploy lại hoặc khởi động lại instance. Với môi trường production, tốt nhất bạn nên chuyển sang cơ sở dữ liệu bên ngoài như PostgreSQL hoặc MySQL.

---

## 1. Tạo git repository và chuẩn bị mã nguồn

1. Mở terminal trong thư mục dự án:
```sh
cd /Users/macbookprom2/phong
```
2. Khởi tạo git repository:
```sh
git init
```
3. Thêm toàn bộ file (trừ các file trong `.gitignore`):
```sh
git add .
```
4. Commit lần đầu:
```sh
git commit -m "Initialize Nguyen Vu Phong website"
```

Nếu bạn đã có repository trên GitHub, thêm remote và push:
```sh
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
```
Thay `USERNAME` và `REPO` bằng thông tin GitHub của bạn.

---

## 2. Deploy lên Render

### 2.1 Chuẩn bị
- Đảm bảo bạn đã có repo trên GitHub chứa mã nguồn.
- Render sẽ cần một `package.json` và `start` script. Dự án của bạn đã có `npm start`.

### 2.2 Tạo dịch vụ mới
1. Đăng nhập vào https://render.com
2. Chọn `New` → `Web Service`
3. Kết nối GitHub và chọn repository của bạn
4. Thiết lập:
   - Branch: `main`
   - Root Directory: để trống nếu `server.js` nằm ở gốc
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Click `Create Web Service`

### 2.3 Thiết lập biến môi trường
Trong dashboard của Render, mở tab `Environment` và thêm:
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE` (`true` hoặc `false`)
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `EMAIL_TO`
- `ADMIN_API_KEY`
- `FB_PAGE_ID` (nếu dùng Facebook notification)
- `FB_PAGE_ACCESS_TOKEN` (nếu dùng Facebook notification)

Render sẽ cung cấp URL app của bạn, ví dụ `https://your-service.onrender.com`.

### 2.4 Gắn domain riêng
1. Trong Render, chọn `Custom Domains`
2. Thêm domain của bạn (`example.com`)
3. Render sẽ hiển thị bản ghi DNS cần cấu hình
4. Vào trang quản lý domain, thêm bản ghi theo hướng dẫn
5. Chờ DNS cập nhật (thường 5-30 phút)

---

## 3. Deploy lên Railway

### 3.1 Chuẩn bị
- Tạo tài khoản Railway và kết nối GitHub
- Đảm bảo repo đã có `package.json` và `server.js`

### 3.2 Triển khai
1. Tạo project mới trong Railway
2. Chọn `Deploy from GitHub`
3. Chọn repo và branch `main`
4. Railway sẽ tự động detect Node.js
5. Set Environment Variables giống Render
6. Triển khai và kiểm tra URL mà Railway cung cấp

---

## 4. Deploy lên VPS riêng

### 4.1 Yêu cầu VPS
- VPS có Node.js và npm
- Quyền SSH vào server
- Domain trỏ về IP VPS

### 4.2 Cài đặt trên server

SSH vào VPS:
```sh
ssh user@your-vps-ip
```

Cài Node.js nếu cần (ví dụ Ubuntu):
```sh
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Clone repository:
```sh
git clone https://github.com/USERNAME/REPO.git
cd REPO
npm install
```

Tạo file `.env` với các biến cần thiết.

### 4.3 Chạy ứng dụng

Chạy trực tiếp:
```sh
PORT=3000 npm start
```

Hoặc dùng `pm2` để chạy background:
```sh
sudo npm install -g pm2
pm2 start server.js --name phong-site --watch
pm2 save
```

### 4.4 Cấu hình reverse proxy

Cài Nginx và cấu hình domain trỏ vào Node app:
```sh
sudo apt-get install nginx
```

Tạo file cấu hình Nginx, ví dụ `/etc/nginx/sites-available/phong`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt site và khởi động lại Nginx:
```sh
sudo ln -s /etc/nginx/sites-available/phong /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.5 Bật HTTPS
Sử dụng Certbot để cấp chứng chỉ SSL miễn phí:
```sh
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 5. Lưu ý quan trọng

- `contacts.db` là SQLite và lưu trên ổ cứng local của instance.
- Trên Render/Railway, filesystem có thể không giữ lâu dài sau khi redeploy.
- Nếu muốn dữ liệu liên hệ an toàn, bạn nên nâng cấp sang database bên ngoài như PostgreSQL hoặc MySQL.

---

## 6. Nếu cần ảnh màn hình

Tôi không thể tự động tạo ảnh trong repo, nhưng bạn có thể chụp các bước sau:
1. Trang `New Web Service` trên Render.
2. Màn hình cấu hình environment variables.
3. Màn hình `Custom Domains` khi thêm domain.

Bạn cũng có thể lấy ảnh màn hình từ tài liệu chính thức của Render, Railway hoặc hướng dẫn VPS.
