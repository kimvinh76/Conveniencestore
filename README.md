# Hệ Thống Quản Lý Cửa Hàng Tiện Lợi (DDBMS)

 Dự án mô phỏng một hệ thống quản lý chuỗi cửa hàng tiện lợi đa chi nhánh với kiến trúc Cơ sở dữ liệu phân tán (Central, Hà Nội, Huế, Sài Gòn).

##  Kiến Trúc Dự Án (Architecture)
Hệ thống được thiết kế theo mô hình **Phân tán Giả lập (Pseudo-Distributed)** thông qua Docker, giúp tối ưu hóa tài nguyên (chỉ tốn khoảng 1/4 RAM so với việc chạy 4 máy ảo SQL Server riêng biệt) mà vẫn giữ nguyên được bản chất truy vấn phân tán.

- **Frontend:** Next.js (React), TailwindCSS.
- **Backend:** Node.js, Express.js.
- **Database:** Microsoft SQL Server .
- **Môi trường:** Docker (1 Container SQL Server chứa 4 Database và được cấu hình Loopback Linked Servers để giả lập kết nối mạng giữa các chi nhánh).

##  Hướng Dẫn Cài Đặt & Chạy Dự Án

Bạn có thể chạy dự án này theo 2 cách

### Cách 1: Dành cho Cài đặt & Chạy Nhanh (Full Docker)


1. Đảm bảo máy đã cài đặt Docker Desktop.
2. Mở Terminal tại thư mục gốc của dự án.
3. Chạy lệnh:
   ```bash
   docker compose up --build
   ```
4. Đợi Terminal báo `Backend API running` và Frontend đã khởi động.
5. Truy cập Web tại: `http://localhost:3000`

### Cách 2: Dành cho Developer (Hybrid Mode - Khuyên dùng khi sửa code)
Cách này giúp bạn code Frontend/Backend có Hot-reload ngay lập tức mà vẫn tận dụng được SQL Server ảo trong Docker.

1. **Khởi động riêng Database:**
   ```bash
   docker compose up database -d
   ```
2. **Khởi động Backend:** Mở Terminal mới, trỏ vào thư mục `backend`:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. **Khởi động Frontend:** Mở Terminal mới, trỏ vào thư mục `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Truy cập Web tại: `http://localhost:3000`


##  Tài Khoản Đăng Nhập Mặc Định
*Thông tin tài khoản nằm trong dữ liệu mẫu của bảng `TaiKhoan`.*

- **Trung Tâm (Central):** `admin_central` / `123456`
- **Hà Nội (Hanoi):** `admin_hanoi` / `123456`
- **Huế (Hue):** `admin_hue` / `123456`
- **Sài Gòn (Saigon):** `admin_saigon` / `123456`

*(Mật khẩu của tất cả tài khoản mặc định đều là 123456).*
