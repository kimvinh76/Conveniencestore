// =================================================================
// GENERIC RBAC PRE-REQUEST SCRIPT - PHIÊN BẢN CHUẨN CHO CẢ POSTMAN & NEWMAN
//
// Cơ chế: 
// - Gọi API Login ngầm bằng pm.sendRequest.
// - Bắt trực tiếp Set-Cookie từ Response của lệnh Login.
// - Inject (nhét) trực tiếp Cookie đó vào Header của Request chính (ở ngay bên trong callback).
// 
// Vì lệnh inject nằm TRONG callback, Postman/Newman sẽ chờ Login xong 
// rồi mới gán Cookie, sau đó mới bắn Request chính -> Hoàn toàn KHÔNG bị delay 1 vòng!
// Đặc biệt: Cách này bypass được lỗi Cookie Jar của Newman đối với localhost.
// =================================================================

// Lấy biến run_as từ file JSON (chạy Automation) HOẶC từ biến môi trường (chạy Manual từng API)
const runAs = pm.iterationData.get("run_as") || pm.environment.get("run_as");

const accounts = {
    "admin_central":  { username: "admin_central",  password: "123456" },
    "admin_branch_1": { username: "admin_hue",       password: "123456" },
    "nv_sales":       { username: "thu_ngan_hue",    password: "123456" }
};

if (runAs === "none") {
    // Không đăng nhập -> gán Cookie rỗng
    pm.request.headers.upsert({ key: "Cookie", value: "" });
    console.log("[PRE-REQ] Giả lập CHƯA đăng nhập.");
} else if (runAs && accounts[runAs]) {
    const creds = accounts[runAs];
    const loginRequest = {
        url: pm.collectionVariables.get("baseUrl") + "/api/auth/login",
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
            mode: "raw",
            raw: JSON.stringify(creds)
        }
    };

    // Postman/Newman sẽ ĐỢI hàm sendRequest này chạy xong mới bắn API chính
    pm.sendRequest(loginRequest, function (err, res) {
        if (err) {
            console.log(`[PRE-REQ] Lỗi mạng khi login: ${err}`);
            return;
        }

        if (res.code === 200) {
            console.log(`[PRE-REQ] Login THÀNH CÔNG: ${runAs} (${creds.username})`);
            
            // 1. Trích xuất Cookie trực tiếp từ Response Header
            const setCookieHeader = res.headers.get("Set-Cookie");
            if (setCookieHeader) {
                // Tách lấy phần session=...
                const cookieValue = setCookieHeader.split(';')[0];
                
                // 2. Ép thẳng Cookie vào Request chuẩn bị được gửi đi!
                pm.request.headers.upsert({
                    key: "Cookie",
                    value: cookieValue
                });
                console.log(`[PRE-REQ] Đã tự động bơm Cookie vào Header.`);
            } else {
                console.log(`[PRE-REQ] Không nhận được Set-Cookie từ server.`);
            }
        } else {
            console.log(`[PRE-REQ] Login THẤT BẠI. Status: ${res.code}`);
        }
    });
} else {
    console.log(`[PRE-REQ] Bỏ qua đăng nhập, run_as="${runAs}" không hợp lệ. Gợi ý: Hãy tạo biến môi trường 'run_as' nếu bạn đang test thủ công.`);
}

// PAYLOAD (BODY) CHO API POST/PATCH
// (Cũng ưu tiên lấy từ Data Driven trước, nếu không có thì lấy từ môi trường)
const payloadData = pm.iterationData.get("payload");
if (payloadData) {
    pm.variables.set("request_payload", JSON.stringify(payloadData));
} else {
    // Khi test manual, nếu user truyền biến request_payload trong Environment thì dùng nó
    const manualPayload = pm.environment.get("request_payload");
    if (manualPayload) {
        pm.variables.set("request_payload", manualPayload);
    }
}
