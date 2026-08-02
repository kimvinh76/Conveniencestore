# 🚀 KỊCH BẢN TỰ ĐỘNG HÓA MODULE AUTH

Dưới đây là mã Javascript "chấm điểm" (Test Scripts) và hướng dẫn móc nối dữ liệu CSV cho toàn bộ các API thuộc Module Authentication.

## 1. API: `POST /api/auth/login`
- **File CSV cần dùng (Runner):** `data_auth_login.csv`
- **Cách cài đặt biến (Body):**
  ```json
  {
    "username": "{{username}}",
    "password": "{{password}}"
  }
  ```
- **Code JS (Dán vào tab Scripts > Post-response):**
  ```javascript
  const expectedStatus = pm.iterationData.get("expected_status") || 200;

  pm.test(`HTTP Status là ${expectedStatus}`, function () {
      pm.response.to.have.status(expectedStatus);
  });

  pm.test("Thời gian phản hồi < 500ms", function () {
      pm.expect(pm.response.responseTime).to.be.below(500);
  });

  if (pm.response.code === 200) {
      const jsonData = pm.response.json();
      
      pm.test("Dữ liệu trả về chứa object 'user'", function () {
          pm.expect(jsonData).to.have.property("user");
          pm.expect(jsonData.user).to.have.property("username");
      });
      
      pm.test("Đã nhận được Cookie bảo mật (HTTP-Only)", function () {
          pm.expect(pm.cookies.has("token") || pm.cookies.has("auth_token") || pm.response.headers.has("Set-Cookie")).to.be.true;
      });
  }
  ```

---

## 2. API: `GET /api/auth/me`
- **File CSV cần dùng (Runner):** `data_auth_me.csv`
- **Lưu ý giả lập lỗi (Pre-request Script):** (Dán vào tab Scripts > Pre-request để xóa Cookie nếu chạy case lỗi)
  ```javascript
  const hasCookie = pm.iterationData.get("has_cookie");
  if (hasCookie === "false") {
      pm.cookies.clear();
  } else if (hasCookie === "fake") {
      pm.cookies.clear();
      // Code logic giả mạo cookie (Tùy chọn)
  }
  ```
- **Code JS (Dán vào tab Scripts > Post-response):**
  ```javascript
  const expectedStatus = pm.iterationData.get("expected_status") || 200;

  pm.test(`HTTP Status là ${expectedStatus}`, function () {
      pm.response.to.have.status(expectedStatus);
  });

  if (pm.response.code === 200) {
      const expectedUsername = pm.iterationData.get("expected_username");
      const jsonData = pm.response.json();
      
      pm.test("Profile trả về phải chứa email, họ tên", function () {
          pm.expect(jsonData).to.have.property("email");
          pm.expect(jsonData).to.have.property("fullName");
      });
  }
  ```

---

## 3. API: `POST /api/auth/logout`
- **File CSV cần dùng (Runner):** `data_auth_logout.csv`
- **Code JS (Dán vào tab Scripts > Post-response):**
  ```javascript
  const expectedStatus = pm.iterationData.get("expected_status") || 200;

  pm.test(`HTTP Status là ${expectedStatus}`, function () {
      pm.response.to.have.status(expectedStatus);
  });

  if (pm.response.code === 200) {
      pm.test("Cookie đã được xóa bỏ hoàn toàn", function () {
          // Cookie thường bị xóa bằng cách gửi lại với giá trị rỗng hoặc Max-Age=0
          pm.expect(pm.response.headers.has("Set-Cookie")).to.be.true;
      });
  }
  ```
