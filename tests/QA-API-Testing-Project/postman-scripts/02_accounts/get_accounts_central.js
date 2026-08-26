// JS Script for GET /api/accounts/central
const testCaseName = pm.iterationData.get("test_case_name") || "Test Case";
const expectedStatus = pm.iterationData.get("expected_status") || 200;
const expectedArray = pm.iterationData.get("expected_array") === true;

pm.test(`[${testCaseName}] - HTTP Status là ${expectedStatus}`, function () {
    pm.response.to.have.status(expectedStatus);
});

if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    
    pm.test("Kiểm tra định dạng dữ liệu trả về", function () {
        pm.expect(jsonData).to.have.property("data");
        if (expectedArray) {
            pm.expect(jsonData.data).to.be.an("array");
            if (jsonData.data.length > 0) {
                // Kiểm tra cấu trúc của 1 tài khoản
                pm.expect(jsonData.data[0]).to.have.property("TenDangNhap");
                pm.expect(jsonData.data[0]).to.have.property("Quyen");
                pm.expect(jsonData.data[0]).to.have.property("ChiNhanh");
            }
        }
    });
} else if (pm.response.code === 401 || pm.response.code === 403) {
    const jsonData = pm.response.json();
    pm.test("Mã lỗi trả về đúng chuẩn báo lỗi phân quyền", function () {
        pm.expect(jsonData).to.have.property("message");
    });
}
