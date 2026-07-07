export default function EmployeeTable({ rows, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th className="w-1/5">Mã NV</th>
            <th className="w-2/5">Họ tên</th>
            <th className="w-1/5">Chức vụ</th>
            <th className="w-1/5">Email</th>
            <th className="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((emp) => (
            <tr key={emp.MaNV}>
              <td className="font-medium">{emp.MaNV}</td>
              <td>{emp.HoTen}</td>
              <td>{emp.ChucVu}</td>
              <td>{emp.Email}</td>
              <td className="text-right whitespace-nowrap">
                <button className="text-blue-600 mr-4 font-semibold" onClick={() => onEdit(emp)}>Sửa</button>
                <button className="text-red-600 font-semibold" onClick={() => onDelete(emp.MaNV)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}