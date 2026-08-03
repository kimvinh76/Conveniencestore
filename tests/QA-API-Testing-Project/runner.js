const newman = require('newman');
const fs = require('fs');
const path = require('path');

// 1. Nhận tham số từ dòng lệnh
const moduleDir = process.argv[2]; // VD: 01_auth
const requestName = process.argv[3]; // VD: login

if (!moduleDir || !requestName) {
    console.error("❌ LỖI: Vui lòng cung cấp đủ Tên Module và Tên API.");
    console.error("Cách dùng: node runner.js <module> <request_name>");
    console.error("Ví dụ: node runner.js 01_auth login");
    process.exit(1);
}

// 2. Tìm file JSON Data tự động
const dataPathFolder = path.join(__dirname, 'data', moduleDir);
if (!fs.existsSync(dataPathFolder)) {
    console.error(`❌ LỖI: Không tìm thấy thư mục ${dataPathFolder}`);
    process.exit(1);
}

const files = fs.readdirSync(dataPathFolder);
// Tìm file JSON có chứa từ khóa của requestName
const jsonFileName = files.find(f => f.toLowerCase().includes(requestName.toLowerCase()) && f.endsWith('.json'));

if (!jsonFileName) {
    console.error(`❌ LỖI: Không tìm thấy file JSON nào chứa từ khóa '${requestName}' trong thư mục ${moduleDir}`);
    process.exit(1);
}

const dataFilePath = path.join(dataPathFolder, jsonFileName);
console.log(`✅ Đã tìm thấy Data File: ${dataFilePath}`);

// 3. Tạo chuỗi Thời gian (Timestamp) đẹp mắt
const now = new Date();
const pad = (n) => (n < 10 ? '0' + n : n);
const timeStr = `${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}s`;
const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
const timestamp = `${timeStr}_${dateStr}`;

// 4. Cấu hình đường dẫn xuất Báo cáo
const reportName = `REPORT_${moduleDir}_${requestName}_${timestamp}.html`.toUpperCase();
const reportPath = path.join(__dirname, 'reports', reportName);

// 5. Chạy Newman
console.log(`🚀 Đang chạy kiểm thử cho API: [${requestName}] thuộc Module [${moduleDir}]...`);

newman.run({
    collection: require('./collections/DDBMS API.postman_collection.json'),
    folder: requestName,
    iterationData: dataFilePath,
    reporters: ['cli', 'htmlextra'],
    reporter: {
        htmlextra: {
            export: reportPath,
            title: `Báo cáo Kiểm thử: API ${requestName.toUpperCase()}`,
            browserTitle: "QA Automation Report",
            titleSize: 4,
            showEnvironmentData: true,
            showGlobalData: true,
            skipSensitiveData: false,
            showMarkdownLinks: true,
            timezone: "Asia/Ho_Chi_Minh"
        }
    }
}, function (err, summary) {
    if (err) {
        console.error("❌ Newman gặp lỗi nghiêm trọng:", err);
        process.exit(1);
    }
    console.log(`\n🎉 HOÀN TẤT! Báo cáo HTML siêu đẹp đã được lưu tại:`);
    console.log(`👉 ${reportPath}`);
    
    // Nếu có test case bị FAIL thì Node.js sẽ trả về exit code 1 (chuẩn CI/CD)
    if (summary.run.failures.length > 0) {
        console.log(`⚠️ Có ${summary.run.failures.length} test case bị FAILED. Vui lòng mở báo cáo để xem chi tiết.`);
        process.exit(1);
    }
});
