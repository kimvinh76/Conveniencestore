# Hệ Thống Quản Lý Cửa Hàng Tiện Lợi Phân Tán (Distributed Convenience Store Management System)

Dự án phát triển một hệ thống quản lý chuỗi cửa hàng tiện lợi đa chi nhánh, áp dụng kiến trúc **Cơ sở dữ liệu phân tán (Distributed Database)** với 4 node (Central, Hà Nội, Huế, Sài Gòn). Dự án được thiết kế theo mô hình Cloud-Native, ứng dụng kiến trúc Microservices (lai) và đồng bộ dữ liệu mức Ứng dụng (Application-level Sync).

## 🚀 Kiến Trúc Hệ Thống (System Architecture)
- **Frontend:** Next.js (React), TailwindCSS.
- **Backend:** Node.js, Express.js.
- **Database:** Microsoft SQL Server (Thiết kế phân mảnh ngang).
- **Infrastructure:** Docker & Docker Compose (Giả lập môi trường phân tán hoàn chỉnh).
- **Testing:** Postman, Newman, Automated API Testing.

---

## 👨‍💻 Vai Trò & Đóng Góp Trong Dự Án (My Contributions)
Trong dự án này, tôi đóng vai trò là **Fullstack / Backend & Data Engineer**, chịu trách nhiệm thiết kế kiến trúc lõi và xây dựng hệ thống từ con số không. Dưới đây là các công việc chính tôi đã thực hiện:

### 1. Kiến trúc Cơ sở Dữ liệu Phân tán (Distributed Database Architecture)
- Xây dựng sơ đồ cơ sở dữ liệu phân tán với 4 Node độc lập: `CENTRAL` (Tổng bộ - Node tổng hợp), `HANOI`, `HUE`, `SAIGON` (Các chi nhánh).
- Áp dụng kỹ thuật **Phân mảnh ngang (Horizontal Partitioning)** dựa trên mã chi nhánh (`ChiNhanh`) để chia tách dữ liệu Hóa Đơn, Phiếu Nhập, Tồn Kho và Tài Khoản.
- Viết và tối ưu hóa hàng loạt **Stored Procedures**, Triggers và Views cho từng Node DB để đảm bảo tính toàn vẹn dữ liệu.

### 2. Backend & Cơ chế Đồng bộ Dữ liệu (Backend & Data Sync)
- Phát triển hệ thống RESTful API bằng **Node.js & Express.js**, xử lý toàn bộ nghiệp vụ (Auth, Bán hàng, Nhập kho, Quản lý Nhân sự, Tích điểm Khuyến mãi).
- **Đột phá về Kiến trúc (Refactoring):** Nhận thấy hạn chế của việc dùng SQL Server Linked Servers truyền thống trong môi trường Cloud/Docker, tôi đã chủ động thiết kế lại cơ chế **Đồng bộ dữ liệu theo thời gian thực ở tầng Ứng dụng (Application-Level Real-time Sync)**. 
- Backend Node.js giờ đây tự động điều phối các giao dịch đa nhánh (Ví dụ: Khi tạo một Phiếu nhập hoặc hóa đơn ở Chi nhánh, Backend sẽ tự động đẩy bản sao lưu lên Central DB ngay lập tức mà không phụ thuộc vào SQL Replication), giúp hệ thống có khả năng chịu lỗi (Fault Tolerance) cực tốt.

### 3. Docker & Triển khai Hạ tầng (Docker & Infrastructure)
- Container hóa (Containerization) toàn bộ ứng dụng bằng **Docker**.
- Cấu hình `docker-compose` tối ưu: Tự động khởi tạo 4 Database độc lập từ các file script migration (`central.sql`, `hanoi.sql`, `hue.sql`, `saigon.sql`) ngay khi hệ thống boot.
- Giải quyết bài toán cấp phát bộ nhớ để chạy 4 DB song song trên cùng 1 container SQL Server ảo, tối ưu hóa tài nguyên so với việc chạy máy ảo truyền thống.

### 4. Kiểm thử Tự động (Automated API Testing)
- Xây dựng kịch bản kiểm thử (Test Automation) cho toàn bộ các luồng API bằng **Postman** và **Newman**.
- Viết các test scripts bằng Node.js (`test-db.js`, `test-pn-schema.js`, `sync-accounts.js`...) để tự động giả lập luồng dữ liệu (Data-driven testing), xác thực tính toàn vẹn và độ lệch pha của dữ liệu giữa Central và các Chi nhánh sau các giao dịch phân tán phức tạp.

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Dự Án (How to Run)

Dự án hỗ trợ 2 chế độ chạy phù hợp cho cả mục đích test nhanh và mục đích phát triển (Development).

### Cách 1: Triển khai nhanh (Full Docker)
*Chỉ cần 1 lệnh duy nhất để dựng toàn bộ Backend, Frontend và 4 Database.*

1. Đảm bảo máy tính đã cài đặt **Docker Desktop** (và đang chạy).
2. Mở Terminal tại thư mục gốc của dự án.
3. Khởi chạy hệ thống:
   ```bash
   docker compose up --build
   ```
4. Quá trình khởi tạo Database lần đầu sẽ mất khoảng 30s - 1 phút. Sau khi Terminal hiển thị `Backend API running on port 5000`, truy cập Web tại: `http://localhost:3000`

### Cách 2: Chế độ Phát triển (Hybrid Mode - Khuyên dùng cho Developer)
*Chế độ này giữ Database chạy trong Docker nhưng chạy Frontend/Backend trực tiếp ở Local máy tính để tận dụng tính năng Hot-reload khi sửa code.*

1. **Khởi động riêng cụm Database:**
   ```bash
   docker compose up database -d
   ```
2. **Khởi động Backend:** (Mở Terminal mới)
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. **Khởi động Frontend:** (Mở Terminal mới)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Truy cập Web tại: `http://localhost:3000`

---

## 🔐 Tài Khoản Đăng Nhập Mặc Định

Hệ thống bảo mật phân quyền cứng (RBAC) theo từng node chi nhánh. *Mật khẩu mặc định cho tất cả tài khoản dưới đây là: `123456`*

| Vai Trò | Chi Nhánh | Tên Đăng Nhập | Tính Năng Nổi Bật |
| :--- | :--- | :--- | :--- |
| **Quản trị toàn bộ** | Central (Tổng bộ) | `admin_central` | Xem báo cáo tổng hợp toàn chuỗi, Quản lý tài khoản toàn bộ. |
| **Quản trị chi nhánh** | Hà Nội | `admin_hanoi` | Quản trị độc lập DB Hà Nội, xem doanh thu HN. |
| **Quản trị chi nhánh** | Huế | `admin_hue` | Quản trị độc lập DB Huế, xem doanh thu Huế. |
| **Quản trị chi nhánh** | Sài Gòn | `admin_saigon` | Quản trị độc lập DB Sài Gòn, xem doanh thu SG. |

*(Lưu ý: Tài khoản của chi nhánh nào chỉ có thể thao tác (Bán hàng, Nhập kho) trên dữ liệu của chi nhánh đó. Central không được phép bán hàng).*
