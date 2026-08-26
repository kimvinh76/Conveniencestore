// JS Script for POST /api/accounts/central
const testCaseName = pm.iterationData.get("test_case_name") || "Test Case";
const expectedStatus = pm.iterationData.get("expected_status") || 201;
const expectedMessageContains = pm.iterationData.get("expected_message_contains");

pm.test(`[${testCaseName}] - HTTP Status là ${expectedStatus}`, function () {
    pm.response.to.have.status(expectedStatus);
});

// Tất cả các response chuẩn từ BE (kể cả lỗi) đều trả về format { "message": "..." }
if (pm.response.code !== 500) {
    const jsonData = pm.response.json();
    pm.test("Kiểm tra thông báo trả về (trường 'message')", function () {
        pm.expect(jsonData).to.have.property("message");
        if (expectedMessageContains) {
            pm.expect(jsonData.message).to.include(expectedMessageContains);
        }
    });
}
