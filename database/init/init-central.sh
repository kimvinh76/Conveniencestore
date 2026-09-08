#!/bin/bash

# 1. Đợi SQL Server khởi động
echo "Đang đợi Central SQL Server khởi động..."
for i in {1..50}; do
    /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" &>/dev/null
    if [ $? -eq 0 ]; then
        echo "Central SQL Server đã sẵn sàng!"
        break
    fi
    echo "Đang thử lại sau 2 giây..."
    sleep 2
done

DB_NAME="CentralDB"
BASE_SQL="/usr/config/central.sql"

# 2. Kiểm tra Database tồn tại chưa (Nếu chưa có mới nạp base.sql)
DB_EXISTS=$(/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -h -1 -W -Q "SET NOCOUNT ON; SELECT database_id FROM sys.databases WHERE name = '$DB_NAME'")

if [ -z "$DB_EXISTS" ]; then
    echo "Đang tạo Database $DB_NAME..."
    /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "CREATE DATABASE [$DB_NAME];"
    
    if [ -f "$BASE_SQL" ]; then
        echo "Đang nạp dữ liệu gốc từ $BASE_SQL..."
        /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i "$BASE_SQL"
    fi
else
    echo "Database $DB_NAME đã tồn tại, bỏ qua bước tạo mới."
fi

# 3. Cấu hình Linked Servers
echo "Đang cấu hình Linked Servers..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "
IF NOT EXISTS (SELECT * FROM sys.servers WHERE name = 'HUE_SERVER')
    EXEC sp_addlinkedserver @server='HUE_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='sql-hue'; 
EXEC sp_addlinkedsrvlogin 'HUE_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';
EXEC sp_serveroption 'HUE_SERVER', 'rpc out', 'true'; 

IF NOT EXISTS (SELECT * FROM sys.servers WHERE name = 'SG_SERVER')
    EXEC sp_addlinkedserver @server='SG_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='sql-saigon'; 
EXEC sp_addlinkedsrvlogin 'SG_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';
EXEC sp_serveroption 'SG_SERVER', 'rpc out', 'true'; 

IF NOT EXISTS (SELECT * FROM sys.servers WHERE name = 'HN_SERVER')
    EXEC sp_addlinkedserver @server='HN_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='sql-hanoi'; 
EXEC sp_addlinkedsrvlogin 'HN_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';
EXEC sp_serveroption 'HN_SERVER', 'rpc out', 'true';
"

# 4. Quản lý Auto-Migration (Chạy các file update mới)
echo "Đang kiểm tra bảng _MigrationsHistory..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d "$DB_NAME" -Q "
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '_MigrationsHistory')
BEGIN
    CREATE TABLE [_MigrationsHistory] (
        MigrationId NVARCHAR(255) PRIMARY KEY,
        AppliedAt DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(50)
    );
END
"

MIGRATION_DIR="/usr/config/migration/docker_updates"
if [ -d "$MIGRATION_DIR" ]; then
    echo "Quét thư mục migration: $MIGRATION_DIR..."
    for file in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
        filename=$(basename "$file")
        ALREADY_APPLIED=$(/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d "$DB_NAME" -h -1 -W -Q "SET NOCOUNT ON; SELECT 1 FROM [_MigrationsHistory] WHERE MigrationId = '$filename'")
        
        if [ "$ALREADY_APPLIED" == "1" ]; then
            echo "  [Skip] Migration $filename đã chạy từ trước."
        else
            echo "  [Apply] Đang chạy migration: $filename..."
            /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d "$DB_NAME" -i "$file"
            if [ $? -eq 0 ]; then
                /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d "$DB_NAME" -Q "INSERT INTO [_MigrationsHistory] (MigrationId, Status) VALUES ('$filename', 'SUCCESS');"
                echo "  [Done] Đã cập nhật $filename thành công!"
            else
                echo "  [Error] Lỗi khi chạy $filename!"
            fi
        fi
    done
fi

echo "=== HOÀN THÀNH SETUP CENTRAL NODE ==="
