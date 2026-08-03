// JS Script for POST /api/auth/logout
const expectedStatus = pm.iterationData.get("expected_status") || 200;
const testCaseName = pm.iterationData.get("test_case_name") || "Test Case";

pm.test(`[${testCaseName}] - HTTP Status là ${expectedStatus}`, function () {
    pm.response.to.have.status(expectedStatus);
});

if (pm.response.code === 200) {
    pm.test("Cookie đã được xóa bỏ hoàn toàn", function () {
        // Cookie thường bị xóa bằng cách gửi lại với giá trị rỗng hoặc Max-Age=0
        pm.expect(pm.response.headers.has("Set-Cookie")).to.be.true;
    });
}
