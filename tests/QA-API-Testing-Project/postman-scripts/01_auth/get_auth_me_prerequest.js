// PRE-REQUEST SCRIPT cho API: GET /api/auth/me
// Dán toàn bộ nội dung này vào tab "Pre-request Script" trên Postman
const hasCookie = pm.iterationData.get("has_cookie");



if (hasCookie === "true") {
    // 1. Gọi ngầm API Login để xin Cookie thật
    const loginRequest = {
        url: pm.collectionVariables.get("baseUrl") + "/api/auth/login",
        method: 'POST',
        header: 'Content-Type:application/json',
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                username: "admin_central",
                password: "123456"
            })
        }
    };

    pm.sendRequest(loginRequest, function (err, res) {
        if (!err) {
            // Lấy chuỗi Cookie từ Header của Response trả về
            // (Vì backend DDBMS dùng Set-Cookie chứ không trả token trong body)
            const setCookieHeader = res.headers.get("Set-Cookie");
            if (setCookieHeader) {
                // Lấy phần token=... trước dấu chấm phẩy
                const cookieValue = setCookieHeader.split(';')[0];
                pm.environment.set("current_cookie", cookieValue);
                console.log("Đã lưu Cookie thật vào biến môi trường:", cookieValue);
            }
        }
    });
} else if (hasCookie === "false") {
    // 2. Ép biến môi trường rỗng
    pm.environment.set("current_cookie", "");
    console.log("Đã ép biến current_cookie rỗng!");
} else if (hasCookie === "fake") {
    // 3. Ép biến môi trường mang Cookie giả mạo
    pm.environment.set("current_cookie", "token=fake_token_abc123");
    console.log("Đã ép biến current_cookie thành đồ giả!");
}

// 4. ÉP BUỘC POSTMAN & NEWMAN PHẢI GỬI HEADER NÀY (Bypass mọi giới hạn giao diện)
pm.request.headers.upsert({
    key: "Cookie",
    value: pm.environment.get("current_cookie")
});
