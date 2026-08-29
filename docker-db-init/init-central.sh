#!/bin/bash

# Đợi SQL Server khởi động
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

echo "Đang tạo Database CentralDB..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "CREATE DATABASE [CentralDB];"

echo "Đang nạp dữ liệu Central..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/central.sql

echo "Đang cấu hình Linked Servers tới các Chi nhánh..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "
EXEC sp_addlinkedserver @server='HUE_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='sql-hue'; 
EXEC sp_addlinkedsrvlogin 'HUE_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';
EXEC sp_addlinkedserver @server='SG_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='sql-saigon'; 
EXEC sp_addlinkedsrvlogin 'SG_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';
EXEC sp_addlinkedserver @server='HN_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='sql-hanoi'; 
EXEC sp_addlinkedsrvlogin 'HN_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';
EXEC sp_serveroption 'HUE_SERVER', 'rpc out', 'true'; 
EXEC sp_serveroption 'SG_SERVER', 'rpc out', 'true'; 
EXEC sp_serveroption 'HN_SERVER', 'rpc out', 'true';
"

echo "=== HOÀN THÀNH SETUP CENTRAL NODE ==="
