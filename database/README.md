# 🗄️ Database Architecture & Migration Workflow (Production Standard)

Hệ thống DDBMS sử dụng 4 node SQL Server 2022 phân tán trên Docker:
1. **CentralDB** (Port: `1404`) - Node trung tâm
2. **Store_HN** (Port: `1403`) - Chi nhánh Hà Nội
3. **Store_H** (Port: `1401`) - Chi nhánh Huế
4. **Store_SG** (Port: `1402`) - Chi nhánh Sài Gòn

---

## 📁 Cấu trúc thư mục

```text
database/
├── init/                         # Các script khởi tạo Docker cho 4 container
│   ├── init-central.sh
│   ├── init-hanoi.sh
│   ├── init-hue.sh
│   └── init-saigon.sh
├── central.sql                   # Dữ liệu gốc mốc chuẩn (Baseline)
├── hanoi.sql
├── hue.sql
├── saigon.sql
└── migration/
    ├── archive_ssms/             # Lưu trữ các file SQL cũ từ thời SSMS
    └── docker_updates/           # CÁC FILE UPDATE SQL MỚI (Tự động chạy qua Docker)
        └── (Đặt file 001_..., 002_... vào đây)
```

---

## ⚡ Cơ chế Auto-Migration của Docker (Native)

Mỗi khi container SQL Server khởi động:
1. Tự động kiểm tra xem Database đã tồn tại chưa:
   - Nếu **chưa có**: Tạo mới Database và nạp file SQL gốc (`central.sql`, `hanoi.sql`,...).
   - Nếu **đã có**: Bỏ qua nạp file gốc để bảo toàn dữ liệu hiện hữu.
2. Tự động kiểm tra bảng lịch sử `[_MigrationsHistory]`.
3. Tự động quét toàn bộ file `.sql` trong `database/migration/docker_updates/` theo thứ tự chữ cái/số (`001_...`, `002_...`):
   - Nếu file **chưa từng chạy**: Thực thi trực tiếp qua `sqlcmd` và ghi nhận trạng thái `SUCCESS` vào `[_MigrationsHistory]`.
   - Nếu file **đã chạy rồi**: Bỏ qua.

---

## 🛠️ Quy trình thêm thay đổi Database mới

1. **KHÔNG** chỉnh sửa trực tiếp vào 4 file SQL gốc.
2. Tạo 1 file SQL mới trong thư mục `database/migration/docker_updates/` theo định dạng:
   `001_ten_thay_doi.sql`, `002_them_cot_xyz.sql`, ...
3. Bất kỳ ai `git pull` code về và chạy `docker compose up` thì Docker SQL Server sẽ **tự động phát hiện và chạy file SQL mới đó**.
