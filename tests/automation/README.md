# DDBMS Automation Testing 🤖

Thư mục này chứa toàn bộ các kịch bản kiểm thử tự động (Automation Scripts) và dữ liệu đầu vào (Data-Driven CSV) cho dự án DDBMS trên công cụ Postman.

## 📂 Cấu trúc thư mục

```text
automation/
├── accounts/          # Chứa kịch bản & data cho Tài khoản & Phân quyền hệ thống
├── analytics/         # Chứa kịch bản & data cho Báo cáo doanh thu Central
├── auth/              # Chứa kịch bản & data cho Đăng nhập, Đăng xuất
├── branch-dashboard/  # Chứa kịch bản & data cho Thống kê tại Chi nhánh
├── brands/            # Chứa kịch bản & data cho Quản lý Thương hiệu
├── categories/        # Chứa kịch bản & data cho Quản lý Danh mục hàng
├── customers/         # Chứa kịch bản & data cho Quản lý Khách hàng
├── employees/         # Chứa kịch bản & data cho Quản lý Nhân sự
├── inventory/         # Chứa kịch bản & data cho Tồn kho từng chi nhánh
├── invoices/          # Chứa kịch bản & data cho Bán hàng / Hóa đơn POS
├── products/          # Chứa kịch bản & data cho Hàng hóa (Central)
├── purchase-receipts/ # Chứa kịch bản & data cho Nhập kho từ Nhà cung cấp
├── revenue/           # Chứa kịch bản & data cho Thống kê dòng tiền
├── suppliers/         # Chứa kịch bản & data cho Nhà cung cấp
├── transfer-stock/    # Chứa kịch bản & data cho Điều chuyển hàng nội bộ
```

## 🛠 Cách sử dụng quy chuẩn cho mỗi Module

Mỗi thư mục module (vd: `auth`) sẽ bao gồm:
1. File **`SCRIPTS.md`**: Chứa toàn bộ các đoạn mã Javascript `pm.test` cho từng API. Bạn copy đoạn mã trong này dán vào tab **Scripts** của Postman (Chỉ làm 1 lần).
2. Các file **`*.csv`**: Đây là bộ dữ liệu Test (Test Cases). 
   - Thay vì test tay từng trường hợp đúng/sai, bạn hãy mở **Postman Runner**.
   - Chọn API cần test, tải file CSV tương ứng lên.
   - Bấm **Run**, Postman sẽ tự động chạy hàng chục kịch bản và tự động chấm điểm!

## 📜 Quy chuẩn lưu Bằng chứng (Test Evidence)

Bên trong **từng module** sẽ có một thư mục con là `evidence/` để lưu trữ Báo cáo xuất ra từ Postman.
Khi xuất file từ Runner, bạn cần lưu tên file theo chuẩn sau để quản lý:

**Cú pháp:** `[TênModule]_[TênAPI]_[LoạiTest]_[NgàyTháng].json`
**Ví dụ cho module Auth (Có 3 API):**
- `Auth_Login_DataDriven_02082026.json` (Bằng chứng test 9 case Login)
- `Auth_Me_DataDriven_02082026.json` (Bằng chứng test Profile)
- `Auth_Logout_DataDriven_02082026.json` (Bằng chứng test Đăng xuất)
- `Auth_IntegrationFlow_02082026.json` (Bằng chứng test nguyên luồng Login -> Profile -> Logout chạy liên tiếp không dùng CSV)

## 🗄️ Câu hỏi thường gặp: Chứa SQL Test ở đâu?

**TUYỆT ĐỐI KHÔNG** lưu các câu lệnh SQL vào thư mục `evidence/`. Thư mục `evidence` CHỈ DÀNH CHO file báo cáo Postman (JSON).

Đối với các kịch bản SQL dùng để kiểm tra chéo dưới Database (Whitebox Test), bạn hãy lưu vào thư mục **`sql/`** nằm ngay bên trong module đó.
Ví dụ: `automation/auth/sql/test_check_user.sql`

Việc phân chia cực kỳ tinh tế này giúp một module có đầy đủ 3 chân kiềng:
1. `data_*.json`: Dữ liệu test đầu vào.
2. `evidence/`: Bằng chứng test đầu ra (Mặt ngoài - API).
3. `sql/`: Kịch bản kiểm tra tầng đáy (Lõi trong - Database).


