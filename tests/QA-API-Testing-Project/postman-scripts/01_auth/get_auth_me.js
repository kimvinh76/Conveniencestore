// JS Script for GET /api/auth/me
const expectedStatus = pm.iterationData.get("expected_status") || 200;
const testCaseName = pm.iterationData.get("test_case_name") || "Test Case";

pm.test(`[${testCaseName}] - HTTP Status là ${expectedStatus}`, function () {
    pm.response.to.have.status(expectedStatus);
});

if (pm.response.code === 200) {
    const expectedUsername = pm.iterationData.get("expected_username");
    const jsonData = pm.response.json();

    pm.test("Profile trả về chứa object 'auth'", function () {
        pm.expect(jsonData).to.have.property("authenticated", true);
        pm.expect(jsonData).to.have.property("auth");
        // Kiểm tra vài field cơ bản trong auth (Tùy backend trả về, ví dụ MaNV, TenDangNhap)
        pm.expect(jsonData.auth).to.be.an('object');
    });
} else if (pm.response.code === 401) {
    pm.test("Mã lỗi trả về không cho phép truy cập", function () {
        const jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property("message");
    });
}


