"use client";

export default function BranchEmployeeTable({ employees, onEdit, onDelete, canManage }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="w-1/5">Mã NV</th>
            <th className="w-2/5">Họ tên</th>
            <th className="w-1/5">Chức vụ</th>
            <th className="w-1/5">Email</th>
            <th className="w-1/5 text-center">Trạng thái</th>
            {canManage && <th className="text-right">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.MaNV}>
              <td className="font-medium">{emp.MaNV}</td>
              <td>{emp.HoTen}</td>
              <td>{emp.ChucVu}</td>
              <td>{emp.Email}</td>
              <td className="text-center">
                {(emp.TrangThai === true || emp.TrangThai === 1) ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Đang làm việc
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 line-through">
                    Nghỉ việc
                  </span>
                )}
              </td>
              {canManage && (
                <td className="text-right whitespace-nowrap">
                  {(emp.TrangThai === true || emp.TrangThai === 1) ? (
                    <>
                      <button className="text-blue-600 mr-4 font-semibold hover:text-blue-800" onClick={() => onEdit(emp)}>Sửa</button>
                      <button className="text-red-600 font-semibold hover:text-red-800" onClick={() => onDelete(emp)}>Xóa</button>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm italic">Đã khóa</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}