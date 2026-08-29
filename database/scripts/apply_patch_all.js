const sql = require('mssql');
const fs = require('fs');
require('dotenv').config();

const configs = [
  {
    server: process.env.HUE_DB_HOST || "192.168.85.128",
    port: Number(process.env.HUE_DB_PORT || 1401),
    user: process.env.HUE_DB_USER || "sa",
    password: process.env.HUE_DB_PASSWORD || "123456",
    database: process.env.HUE_DB_NAME || "Store_H",
    options: { encrypt: false, trustServerCertificate: true },
    name: 'HUE'
  },
  {
    server: process.env.SAIGON_DB_HOST || "192.168.85.128",
    port: Number(process.env.SAIGON_DB_PORT || 1402),
    user: process.env.SAIGON_DB_USER || "sa",
    password: process.env.SAIGON_DB_PASSWORD || "123456",
    database: process.env.SAIGON_DB_NAME || "Store_SG",
    options: { encrypt: false, trustServerCertificate: true },
    name: 'SAIGON'
  },
  {
    server: process.env.HANOI_DB_HOST || "192.168.85.128",
    port: Number(process.env.HANOI_DB_PORT || 1403),
    user: process.env.HANOI_DB_USER || "sa",
    password: process.env.HANOI_DB_PASSWORD || "123456",
    database: process.env.HANOI_DB_NAME || "Store_HN",
    options: { encrypt: false, trustServerCertificate: true },
    name: 'HANOI'
  },
  {
    server: process.env.CENTRAL_DB_HOST || "192.168.85.128",
    port: Number(process.env.CENTRAL_DB_PORT || 1404),
    user: process.env.CENTRAL_DB_USER || "sa",
    password: process.env.CENTRAL_DB_PASSWORD || "123456",
    database: process.env.CENTRAL_DB_NAME || "CentralDB",
    options: { encrypt: false, trustServerCertificate: true },
    name: 'CENTRAL'
  }
];

async function run() {
  const scriptContent = fs.readFileSync('../migration/patch_khuyenmai_tichdiem.sql', 'utf8');
  const batches = scriptContent.split(/\bGO\b/i);

  for (let config of configs) {
    try {
      let pool = await sql.connect(config);
      for (let batch of batches) {
        if (batch.trim()) {
          try {
            await pool.request().batch(batch);
          } catch (e) {
            console.error('Error executing batch on ' + config.name + ':', e.message);
          }
        }
      }
      console.log('Applied patch to ' + config.name + ' successfully!');
      await pool.close();
    } catch (err) {
      console.error('Failed on ' + config.name + ':', err.message);
    }
  }
}
run();
