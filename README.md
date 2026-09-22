# Hệ Thống Quản Lý Cửa Hàng Tiện Lợi Phân Tán (Distributed Convenience Store Management System)

Dự án phát triển một hệ thống quản lý chuỗi cửa hàng tiện lợi đa chi nhánh, áp dụng kiến trúc **Cơ sở dữ liệu phân tán (Distributed Database)** với 4 node (Central, Hà Nội, Huế, Sài Gòn). Dự án được thiết kế theo mô hình Cloud-Native, ứng dụng kiến trúc Microservices (lai) và đồng bộ dữ liệu mức Ứng dụng (Application-level Sync).

## 🚀 Kiến Trúc Hệ Thống (System Architecture)
- **Frontend:** Next.js (React), TailwindCSS.
- **Backend:** Node.js, Express.js.
- **Database:** Microsoft SQL Server (Thiết kế phân mảnh ngang).
- **Message Broker:** RabbitMQ (Xử lý đồng bộ dữ liệu bất đồng bộ).
- **Reverse Proxy / Routing:** NGINX (Định tuyến thông minh qua Subdomain).
- **Infrastructure:** Docker & Docker Compose (Giả lập môi trường phân tán hoàn chỉnh).

---

## 👨‍💻 Vai Trò & Đóng Góp Trong Dự Án (My Contributions)
Trong dự án này, tôi đóng vai trò là **Fullstack / Backend & Data Engineer**, chịu trách nhiệm thiết kế kiến trúc lõi và xây dựng hệ thống từ con số không. Dưới đây là các công việc chính tôi đã thực hiện:

### 1. Kiến trúc Cơ sở Dữ liệu Phân tán & Định Tuyến Động (Dynamic Routing)
- Áp dụng kỹ thuật **Phân mảnh ngang (Horizontal Partitioning)** dựa trên mã chi nhánh (`ChiNhanh`).
- Xây dựng hệ thống **Subdomain Routing với NGINX**: Cấu hình 4 tên miền ảo (`central.ddbms.local`, `saigon.ddbms.local`, `hanoi.ddbms.local`, `hue.ddbms.local`) trỏ về NGINX Reverse Proxy.
- NGINX tự động đánh dấu người dùng thuộc chi nhánh nào (Gắn cờ Header `X-Branch-Name`) và chuyển tiếp xuống Backend.
- Tự động hóa hoàn toàn luồng Đăng nhập: Người dùng không cần phải chọn Server khi đăng nhập như các ứng dụng truyền thống. Backend Node.js tự động chọc đúng vào Database tương ứng thông qua NGINX Header.

### 2. Xử lý Đồng bộ Dữ liệu Tốc độ cao (Message Broker & Real-time Sync)
- Nhận thấy những điểm thắt cổ chai (bottleneck) của SQL Server Linked Servers truyền thống khi tải cao, tôi đã chuyển đổi kiến trúc đồng bộ từ mức cơ sở dữ liệu sang mức Ứng dụng (Application-Level Sync).
- Tích hợp **RabbitMQ** để xử lý các Event phân tán. Bất cứ khi nào Chi nhánh có giao dịch (nhập kho, bán hàng), một sự kiện (Message) sẽ được đẩy vào Hàng đợi (Queue) của RabbitMQ.
- Các Background Workers (Sync Worker) chạy ngầm sẽ tiêu thụ Message này và tiến hành đồng bộ lên Server Trung tâm (Central DB) một cách bất đồng bộ (Asynchronous), đảm bảo hiệu năng của các API không bị gián đoạn và cam kết tính chịu lỗi (Fault Tolerance) cực tốt.

### 3. Docker, Auto-Migration & Triển khai Hạ tầng
- Cấu hình `docker-compose.yml` cực kỳ chuyên nghiệp với **Docker Profiles** (Tách bạch giữa môi trường Development và Production).
- Xây dựng cơ chế **Auto-Migration tương tự Flyway**: Các file Bash Script (`init-*.sh`) có khả năng theo dõi Checksum của các file `.sql`. Khi chạy hệ thống, nếu có kịch bản SQL mới, Docker sẽ đợi Database khởi động (ONLINE) và tự động apply file `.sql` mới vào Database mà không làm mất dữ liệu cũ.

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Dự Án (How to Run)

Dự án yêu cầu cài đặt **Tên miền ảo** vào file `hosts` của hệ điều hành trước khi khởi chạy.

### Bước 1: Cấu hình tên miền ảo (Bắt buộc)
Mở file `hosts` của hệ điều hành (Đường dẫn Windows: `C:\Windows\System32\drivers\etc\hosts`) bằng quyền Administrator và thêm 4 dòng sau vào cuối file:
```text
127.0.0.1   saigon.ddbms.local
127.0.0.1   hanoi.ddbms.local
127.0.0.1   hue.ddbms.local
127.0.0.1   central.ddbms.local
```

### Bước 2: Khởi chạy dự án (Chọn 1 trong 2 chế độ)

#### Chế độ 1: Lập trình (Development Mode) 
*Ở chế độ này, Docker chỉ chạy Database, RabbitMQ và NGINX. Bạn chạy trực tiếp Frontend/Backend ở Local Terminal để code tự động cập nhật (Hot-Reload) khi chỉnh sửa.*

> **⚠️ LƯU Ý QUAN TRỌNG:** Hệ thống yêu cầu đăng nhập **bắt buộc thông qua tên miền ảo**. Truy cập `http://localhost:3000` sẽ bị từ chối ở bước đăng nhập. Vui lòng hoàn tất Bước 1 (Cấu hình file `hosts`) trước khi khởi chạy.

1. Khởi động Hạ tầng Core (Nginx, SQL, RabbitMQ):
   ```bash
   docker compose up -d
   ```
2. Mở Terminal mới, khởi động Backend:
   ```bash
   cd backend
   npm run dev
   ```
3. Mở Terminal mới, khởi động Frontend:
   ```bash
   cd frontend
   npm run dev
   ```
4. Truy cập web **bắt buộc** qua tên miền ảo (Ví dụ: `http://saigon.ddbms.local`). Đăng nhập bằng tài khoản của đúng chi nhánh đó.
#### Chế độ 2: Trình diễn / Chạy thực tế (Production Profile)
*Chỉ với 1 dòng lệnh, Docker sẽ ôm trọn 100% dự án (bao gồm cả Node.js Frontend và Backend) chạy ngầm hoàn toàn.*

```bash
docker compose --profile production up -d
```
Quá trình khởi tạo lần đầu sẽ mất khoảng 30s. Sau đó mở trình duyệt và truy cập **bắt buộc** qua tên miền ảo (vd: `http://saigon.ddbms.local`). Đăng nhập qua `localhost:3000` sẽ bị hệ thống từ chối.

*(Lưu ý: Nếu cần thay đổi cấu trúc SQL, hãy bỏ file `.sql` vào thư mục `database/migration/docker_updates/`, sau đó gõ `docker compose restart sql-saigon sql-hanoi sql-hue sql-central` để hệ thống tự nạp (Auto-Migration) mà không mất dữ liệu).*

---

## 🔐 Tài Khoản Đăng Nhập Mặc Định

Hệ thống bảo mật phân quyền cứng (RBAC) theo từng node chi nhánh. *Mật khẩu mặc định cho tất cả tài khoản dưới đây là: `123456`*

| Vai Trò | Chi Nhánh (Truy cập) | Tên Đăng Nhập | Tính Năng Nổi Bật |
| :--- | :--- | :--- | :--- |
| **Quản trị toàn chuỗi** | `central.ddbms.local` | `admin_central` | Xem báo cáo tổng hợp toàn chuỗi, Quản lý tài khoản toàn bộ. |
| **Quản trị chi nhánh** | `hanoi.ddbms.local` | `admin_hanoi` | Quản trị độc lập DB Hà Nội, xem doanh thu HN. |
| **Quản trị chi nhánh** | `hue.ddbms.local` | `admin_hue` | Quản trị độc lập DB Huế, xem doanh thu Huế. |
| **Quản trị chi nhánh** | `saigon.ddbms.local` | `admin_saigon` | Quản trị độc lập DB Sài Gòn, xem doanh thu SG. |

*(Lưu ý: Mỗi tài khoản Quản trị Chi nhánh chỉ đăng nhập được vào đúng tên miền ảo của chi nhánh đó. Nếu truy cập sai tên miền, hệ thống sẽ báo sai thông tin).*
