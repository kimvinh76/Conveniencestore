// JS Script for POST /api/auth/login
const expectedStatus = pm.iterationData.get("expected_status") || 200;
const testCaseName = pm.iterationData.get("test_case_name") || "Test Case";

pm.test(`[${testCaseName}] - HTTP Status là ${expectedStatus}`, function () {
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
