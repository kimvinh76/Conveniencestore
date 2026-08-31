/**
 * apply_patch_all.js
 *
 * Công cụ chạy một file migration SQL lên tất cả 4 node Docker cùng lúc.
 *
 * Cách dùng:
 *   node apply_patch_all.js <tên_file.sql>
 *
 * Ví dụ:
 *   node apply_patch_all.js patch_khuyenmai_tichdiem.sql
 *   node apply_patch_all.js 023_them_cot_diachi.sql
 *
 * File SQL phải nằm trong thư mục ../migration/
 * Script đọc cấu hình DB từ file ../../backend/.env (trỏ vào Docker localhost)
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Đọc .env từ backend (chứa thông tin kết nối DB localhost → Docker)
require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });

// ============================================================
// CẤU HÌNH 4 NODE — Đọc từ .env, fallback về Docker defaults
// ============================================================
const configs = [
  {
    name: 'CENTRAL',
    server: process.env.CENTRAL_DB_HOST || "localhost",
    port: Number(process.env.CENTRAL_DB_PORT || 1404),
    user: process.env.CENTRAL_DB_USER || "sa",
    password: process.env.CENTRAL_DB_PASSWORD || "DDBMS@2026!",
    database: process.env.CENTRAL_DB_NAME || "CentralDB",
    options: { encrypt: false, trustServerCertificate: true },
  },
  {
    name: 'HUE',
    server: process.env.HUE_DB_HOST || "localhost",
    port: Number(process.env.HUE_DB_PORT || 1401),
    user: process.env.HUE_DB_USER || "sa",
    password: process.env.HUE_DB_PASSWORD || "DDBMS@2026!",
    database: process.env.HUE_DB_NAME || "Store_H",
    options: { encrypt: false, trustServerCertificate: true },
  },
  {
    name: 'SAIGON',
    server: process.env.SAIGON_DB_HOST || "localhost",
    port: Number(process.env.SAIGON_DB_PORT || 1402),
    user: process.env.SAIGON_DB_USER || "sa",
    password: process.env.SAIGON_DB_PASSWORD || "DDBMS@2026!",
    database: process.env.SAIGON_DB_NAME || "Store_SG",
    options: { encrypt: false, trustServerCertificate: true },
  },
  {
    name: 'HANOI',
    server: process.env.HANOI_DB_HOST || "localhost",
    port: Number(process.env.HANOI_DB_PORT || 1403),
    user: process.env.HANOI_DB_USER || "sa",
    password: process.env.HANOI_DB_PASSWORD || "DDBMS@2026!",
    database: process.env.HANOI_DB_NAME || "Store_HN",
    options: { encrypt: false, trustServerCertificate: true },
  },
];

// ============================================================
// ĐỌC TÊN FILE SQL TỪ ARGUMENT DÒNG LỆNH
// ============================================================
const sqlFileName = process.argv[2];
if (!sqlFileName) {
  console.error('\n[ERROR] Thieu ten file SQL!');
  console.error('   Cu phap: node apply_patch_all.js <ten_file.sql>');
  console.error('   Vi du:   node apply_patch_all.js patch_khuyenmai_tichdiem.sql\n');
  process.exit(1);
}

const sqlFilePath = path.resolve(__dirname, '../migration', sqlFileName);
if (!fs.existsSync(sqlFilePath)) {
  console.error(`\n[ERROR] Khong tim thay file: ${sqlFilePath}\n`);
  process.exit(1);
}

// ============================================================
// HÀM APPLY LÊN MỘT NODE
// ============================================================
async function applyToNode(config) {
  const pool = await sql.connect(config);
  const scriptContent = fs.readFileSync(sqlFilePath, 'utf8');

  // Tách các batch theo từ khóa GO (chuẩn SQL Server)
  const batches = scriptContent.split(/^\s*GO\s*$/im).filter(b => b.trim());

  let successCount = 0;
  let errorCount = 0;
  for (const batch of batches) {
    try {
      await pool.request().batch(batch);
      successCount++;
    } catch (e) {
      // Hide expected errors related to database not existing for branch nodes when running Central-only scripts
      if (e.message.includes("does not exist") || e.message.includes("Could not find server")) {
        console.error(`      [IGNORING] Ban ghi khong ap dung cho nhanh nay (${e.message.substring(0, 50)}...)`);
      } else {
        console.error(`      [Loi batch] ${config.name}: ${e.message}`);
      }
      errorCount++;
    }
  }

  await pool.close();
  return { successCount, errorCount };
}

// ============================================================
// MAIN: APPLY LÊN TẤT CẢ CÁC NODE
// ============================================================
async function run() {
  console.log(`\n[START] File migration: ${sqlFileName}`);
  console.log(`[INFO] Duong dan:       ${sqlFilePath}`);
  console.log(`[INFO] Dang apply len ${configs.length} node...\n`);
  console.log('-'.repeat(55));

  for (const config of configs) {
    process.stdout.write(`[APPLYING] ${config.name.padEnd(7)} (${config.server}:${config.port}/${config.database}) ... `);
    try {
      const { successCount, errorCount } = await applyToNode(config);
      if (errorCount === 0) {
        console.log(`OK (${successCount} batches)`);
      } else {
        console.log(`DONE WITH ${errorCount} ERRORS (${successCount} batches OK)`);
      }
    } catch (err) {
      console.log(`FAILED`);
      console.error(`   Nguyen nhan: ${err.message}`);
    }
  }

  console.log('-'.repeat(55));
  console.log('[END] Hoan thanh!\n');
}

run().catch(err => {
  console.error('Lỗi không mong muốn:', err);
  process.exit(1);
});

