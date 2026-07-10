#!/bin/bash

# Đợi SQL Server khởi động
echo "Đang đợi SQL Server khởi động..."
for i in {1..50}; do
    /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" &>/dev/null
    if [ $? -eq 0 ]; then
        echo "SQL Server đã sẵn sàng!"
        break
    fi
    echo "Đang thử lại sau 2 giây..."
    sleep 2
done

echo "Đang tạo các Database..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "CREATE DATABASE [CentralDB]; CREATE DATABASE [Store_HN]; CREATE DATABASE [Store_H]; CREATE DATABASE [Store_SG];"

echo "Đang cấu hình Linked Servers ảo (Loopback) để giả lập phân tán..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "EXEC sp_addlinkedserver @server='HUE_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='localhost'; EXEC sp_addlinkedsrvlogin 'HUE_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';"
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "EXEC sp_addlinkedserver @server='SG_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='localhost'; EXEC sp_addlinkedsrvlogin 'SG_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';"
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "EXEC sp_addlinkedserver @server='HN_SERVER', @srvproduct='', @provider='MSOLEDBSQL', @datasrc='localhost'; EXEC sp_addlinkedsrvlogin 'HN_SERVER', 'false', NULL, 'sa', '$MSSQL_SA_PASSWORD';"
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "EXEC sp_serveroption 'HUE_SERVER', 'rpc out', 'true'; EXEC sp_serveroption 'SG_SERVER', 'rpc out', 'true'; EXEC sp_serveroption 'HN_SERVER', 'rpc out', 'true';"

echo "Đang nạp database Ha Noi..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/hanoi.sql

echo "Đang nạp database Hue..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/hue.sql

echo "Đang nạp database Sai Gon..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/saigon.sql

echo "Đang nạp database Central..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/central.sql

echo "=== HOÀN THÀNH SETUP DATABASE PHÂN TÁN CHO DDBMS ==="
