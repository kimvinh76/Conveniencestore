const newman = require('newman');
const fs = require('fs');
const path = require('path');

// 1. Nhận tham số từ dòng lệnh
const moduleDir = process.argv[2]; // VD: 02_accounts
const requestName = process.argv[3]; // VD: branch

if (!moduleDir || !requestName) {
    console.error("LỖI: Vui lòng cung cấp đủ Tên Module và Tên API.");
    console.error("Cách dùng: node runner.js <module> <request_name>");
    process.exit(1);
}

// 2. Tìm file JSON Data tự động
const dataPathFolder = path.join(__dirname, 'data', moduleDir);
if (!fs.existsSync(dataPathFolder)) {
    console.error(` LỖI: Không tìm thấy thư mục ${dataPathFolder}`);
    process.exit(1);
}

const files = fs.readdirSync(dataPathFolder);
// Tìm file JSON có chứa từ khóa
const jsonFileName = files.find(f => f.toLowerCase().includes(requestName.toLowerCase()) && f.endsWith('.json'));

if (!jsonFileName) {
    console.error(` LỖI: Không tìm thấy file JSON nào chứa từ khóa '${requestName}' trong thư mục ${moduleDir}`);
    process.exit(1);
}

const dataFilePath = path.join(dataPathFolder, jsonFileName);
console.log(` Đã tìm thấy Data File: ${dataFilePath}`);

// --- XỬ LÝ CHỐNG TRÙNG TÊN API ---
// Vì Swagger sinh tên API trùng nhau (vd: GET /api/accounts/branch và POST /api/accounts/branch)
// Ta sẽ lọc collection trong bộ nhớ để CHỈ GIỮ LẠI đúng 1 API dựa vào tên file JSON!
// VD: tên file là "get_accounts_branch.json" -> tìm API method=GET và URL chứa "accounts" và "branch"

const baseName = jsonFileName.replace('.json', '');
const parts = baseName.split('_');
const targetMethod = parts[0].toUpperCase();
const targetKeywords = parts.slice(1).filter(k => k !== 'id');

const originalCollection = require('./collections/DDBMS API.postman_collection.json');
let matchedItem = null;

function walkItems(items) {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.item) {
            walkItems(item.item);
        } else if (!matchedItem) {
            const itemMethod = (item.request?.method || '').toUpperCase();
            if (itemMethod === targetMethod) {
                const rawUrl = typeof item.request?.url === 'string'
                    ? item.request.url
                    : item.request?.url?.raw || '';
                const urlLower = rawUrl.toLowerCase();
                const allMatch = targetKeywords.every(kw => urlLower.includes(kw.toLowerCase()));
                if (allMatch) {
                    matchedItem = item;
                }
            }
        }
    }
}
walkItems(originalCollection.item);

if (!matchedItem) {
    console.error(` LỖI: Không tìm thấy API nào trong Collection khớp với method=${targetMethod} và keywords=[${targetKeywords.join(',')}]`);
    process.exit(1);
}

console.log(` Đã trích xuất chính xác API: [${targetMethod}] ${matchedItem.request?.url?.raw || matchedItem.request?.url}`);

// Tạo một collection "tạm thời" chỉ chứa duy nhất API này để chạy
const filteredCollection = {
    info: originalCollection.info,
    item: [matchedItem],
    variable: originalCollection.variable
};
// ---------------------------------

// 3. Tạo chuỗi Thời gian (Timestamp)
const now = new Date();
const pad = (n) => (n < 10 ? '0' + n : n);
const timeStr = `${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}s`;
const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
const timestamp = `${timeStr}_${dateStr}`;

const reportName = `REPORT_${moduleDir}_${requestName}_${timestamp}.html`.toUpperCase();
const reportPath = path.join(__dirname, 'reports', reportName);

console.log(` Đang chạy kiểm thử...`);

newman.run({
    collection: filteredCollection, // Sử dụng collection đã lọc
    iterationData: dataFilePath,
    reporters: ['cli', 'htmlextra'],
    reporter: {
        htmlextra: {
            export: reportPath,
            title: `Báo cáo: [${targetMethod}] ${requestName.toUpperCase()}`,
            browserTitle: "QA Automation Report",
            titleSize: 4,
            showEnvironmentData: true,
            showGlobalData: true
        }
    }
}, function (err, summary) {
    if (err) {
        console.error(" Newman gặp lỗi nghiêm trọng:", err);
        process.exit(1);
    }
    console.log(`\n HOÀN TẤT! Báo cáo HTML đã được lưu tại:\n ${reportPath}`);

    if (summary.run.failures.length > 0) {
        console.log(` Có ${summary.run.failures.length} test case bị FAILED. Vui lòng mở báo cáo để xem chi tiết.`);
        process.exit(1);
    }
});
