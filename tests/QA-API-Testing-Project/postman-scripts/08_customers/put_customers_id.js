// JS Script for PUT /api/customers/{id}
const testCaseName = pm.iterationData.get("test_case_name") || "Test Case";
const expectedStatus = pm.iterationData.get("expected_status") || 200;

pm.test(`[${testCaseName}] - HTTP Status là ${expectedStatus}`, function () {
    pm.response.to.have.status(expectedStatus);
});
