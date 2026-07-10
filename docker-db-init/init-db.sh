#!/bin/bash

# Đợi SQL Server khởi động (khoảng 30 giây)
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

# Lưu ý: Các file SQL được tự động tạo kèm database bằng USE [DatabaseName] 
# (Ví dụ: USE [CentralDB]) bên trong file khi xuất từ SSMS.
# Chúng ta chỉ cần chạy các file này theo thứ tự.

echo "Đang nạp database Central..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/central.sql

echo "Đang nạp database Ha Noi..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/hanoi.sql

echo "Đang nạp database Hue..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/hue.sql

echo "Đang nạp database Sai Gon..."
/opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -i /usr/config/saigon.sql

echo "=== HOÀN THÀNH SETUP DATABASE PHÂN TÁN CHO DDBMS ==="
