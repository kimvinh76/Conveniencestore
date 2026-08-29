#!/bin/bash

echo "Đang đợi Hanoi SQL Server khởi động..."
for i in {1..50}; do
    /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" &>/dev/null
    if [ $? -eq 0 ]; then
        echo "Hanoi SQL Server đã sẵn sàng!"
        break
    fi
    echo "Đang thử lại sau 2 giây..."
    sleep 2
done

echo "Đang tạo Database Store_HN..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "CREATE DATABASE [Store_HN];"

echo "Đang nạp dữ liệu Hanoi..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/hanoi.sql

echo "Đang cấu hình Linked Servers tới Central..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "
EXEC sp_addlinkedserver @server='CENTRAL_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='sql-central'; 
EXEC sp_addlinkedsrvlogin 'CENTRAL_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';
EXEC sp_serveroption 'CENTRAL_SERVER', 'rpc out', 'true'; 
"

echo "=== HOÀN THÀNH SETUP HANOI NODE ==="
