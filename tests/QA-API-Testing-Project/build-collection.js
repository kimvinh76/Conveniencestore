const fs = require('fs');
const path = require('path');

const COLLECTION_PATH = path.join(__dirname, 'collections', 'DDBMS API.postman_collection.json');
const SCRIPTS_ROOT = path.join(__dirname, 'postman-scripts');

let collection;
try {
    collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, 'utf8'));
} catch (e) {
    console.error('❌ Không đọc được collection JSON:', e.message);
    process.exit(1);
}

let updatedCount = 0;

function walkItems(items, callback) {
    items.forEach(item => {
        if (item.item) {
            walkItems(item.item, callback);
        } else {
            callback(item);
        }
    });
}

function readScriptLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').map(line => line.replace(/\r$/, ''));
}

function upsertEvent(item, listenType, scriptLines) {
    if (!item.event) item.event = [];
    const existing = item.event.find(e => e.listen === listenType);
    if (existing) {
        existing.script.exec = scriptLines;
    } else {
        item.event.push({
            listen: listenType,
            script: {
                type: 'text/javascript',
                exec: scriptLines
            }
        });
    }
}

function applyGenericPrerequest() {
    const prereqPath = path.join(SCRIPTS_ROOT, '02_accounts', 'generic_rbac_prerequest.js');
    if (!fs.existsSync(prereqPath)) return;
    
    const lines = readScriptLines(prereqPath);
    
    walkItems(collection.item, (item) => {
        const rawUrl = typeof item.request?.url === 'string'
            ? item.request.url
            : item.request?.url?.raw || '';
        
        if (rawUrl.includes('/api/accounts')) {
            upsertEvent(item, 'prerequest', lines);
            
            // TỰ ĐỘNG BIẾN ĐỔI BODY SWAGGER THÀNH DATA-DRIVEN
            // Để Postman có thể lấy JSON payload từ file data thay vì dùng dummy data của Swagger
            if (item.request && item.request.method !== 'GET' && item.request.body) {
                if (item.request.body.mode === 'raw') {
                    item.request.body.raw = '{{request_payload}}';
                }
            }
            
            updatedCount++;
        }
    });
}

function processScriptsFolder(folderPath) {
    if (!fs.existsSync(folderPath)) return;

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

    files.forEach(fileName => {
        if (fileName === 'generic_rbac_prerequest.js') return;

        const filePath = path.join(folderPath, fileName);
        const scriptLines = readScriptLines(filePath);

        const baseName = fileName.replace('.js', '');
        const parts = baseName.split('_');
        if (parts.length < 2) return;

        const method = parts[0].toUpperCase();
        const urlKeywords = parts.slice(1).filter(k => k !== 'id');

        let matched = null;
        walkItems(collection.item, (item) => {
            if (matched) return;

            const itemMethod = (item.request?.method || '').toUpperCase();
            if (itemMethod !== method) return;

            const rawUrl = typeof item.request?.url === 'string'
                ? item.request.url
                : item.request?.url?.raw || '';

            const urlLower = rawUrl.toLowerCase();
            const allMatch = urlKeywords.every(kw => urlLower.includes(kw.toLowerCase()));
            if (allMatch) {
                matched = item;
            }
        });

        if (matched) {
            upsertEvent(matched, 'test', scriptLines);
            updatedCount++;
        }
    });
}

applyGenericPrerequest();

const moduleFolders = fs.readdirSync(SCRIPTS_ROOT)
    .filter(f => fs.statSync(path.join(SCRIPTS_ROOT, f)).isDirectory());

moduleFolders.forEach(module => {
    processScriptsFolder(path.join(SCRIPTS_ROOT, module));
});

fs.writeFileSync(COLLECTION_PATH, JSON.stringify(collection, null, 2), 'utf8');
console.log(`\n🎉 Hoàn tất! Đã cập nhật ${updatedCount} sự kiện và biến đổi Body thành Data-Driven.`);
