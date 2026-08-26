// JS Script for PATCH /api/accounts/central/:username/lock
const testCaseName = pm.iterationData.get("test_case_name") || "Test Case";
const expectedStatus = pm.iterationData.get("expected_status") || 200;

pm.test(`[${testCaseName}] - HTTP Status là ${expectedStatus}`, function () {
    pm.response.to.have.status(expectedStatus);
});

if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.test("Kiểm tra thông báo thành công", function () {
        pm.expect(jsonData).to.have.property("message");
    });
} else if (pm.response.code === 401 || pm.response.code === 403) {
    const jsonData = pm.response.json();
    pm.test("Mã lỗi trả về đúng chuẩn báo lỗi phân quyền", function () {
        pm.expect(jsonData).to.have.property("error").or.to.have.property("message");
    });
} else if (pm.response.code === 400) {
    const jsonData = pm.response.json();
    pm.test("Mã lỗi trả về đúng chuẩn báo lỗi dữ liệu", function () {
        pm.expect(jsonData).to.have.property("message");
    });
}
