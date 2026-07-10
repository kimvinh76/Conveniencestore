"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const showNotification = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [nccToDelete, setNccToDelete] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [formData, setFormData] = useState({
    maNCC: "",
    tenNCC: "",
    dienThoai: "",
    diaChi: "",
    email: ""
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/suppliers");
      setSuppliers(data);
    } catch (error) {
      console.error(error);
      showNotification("Không thể tải danh sách nhà cung cấp", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setFormData({
      maNCC: "",
      tenNCC: "",
      dienThoai: "",
      diaChi: "",
      email: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ncc) => {
    setModalMode("edit");
    setFormData({
      maNCC: ncc.MaNCC,
      tenNCC: ncc.TenNCC,
      dienThoai: ncc.DienThoai || "",
      diaChi: ncc.DiaChi || "",
      email: ncc.Email || ""
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (ncc) => {
    setNccToDelete(ncc);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!nccToDelete) return;
    try {
      await apiFetch(`/api/suppliers/${nccToDelete.MaNCC}`, { method: "DELETE" });
      showNotification("Ngừng hoạt động nhà cung cấp thành công", "success");
      setIsDeleteModalOpen(false);
      setNccToDelete(null);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      showNotification(error.message || "Không thể ngừng hoạt động nhà cung cấp", "error");
    }
  };

  const handleReactivate = async (ncc) => {
    try {
      await apiFetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maNCC: ncc.MaNCC,
          tenNCC: ncc.TenNCC,
          dienThoai: ncc.DienThoai || "",
          diaChi: ncc.DiaChi || "",
          email: ncc.Email || ""
        })
      });
      showNotification("Kích hoạt lại nhà cung cấp thành công", "success");
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      showNotification(error.message || "Kích hoạt thất bại", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.maNCC.trim() || !formData.tenNCC.trim()) {
      showNotification("Vui lòng điền mã và tên nhà cung cấp", "error");
      return;
    }

    try {
      if (modalMode === "create") {
        await apiFetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maNCC: formData.maNCC.trim(),
            tenNCC: formData.tenNCC.trim(),
            dienThoai: formData.dienThoai.trim(),
            diaChi: formData.diaChi.trim(),
            email: formData.email.trim()
          })
        });
        showNotification("Thêm nhà cung cấp thành công", "success");
      } else {
        await apiFetch(`/api/suppliers/${formData.maNCC}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenNCC: formData.tenNCC.trim(),
            dienThoai: formData.dienThoai.trim(),
            diaChi: formData.diaChi.trim(),
            email: formData.email.trim()
          })
        });
        showNotification("Cập nhật nhà cung cấp thành công", "success");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      showNotification(error.message || "Thao tác thất bại", "error");
    }
  };

  const filteredSuppliers = suppliers.filter(ncc => 
    ncc.MaNCC.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ncc.TenNCC.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ncc.DienThoai && ncc.DienThoai.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý nhà cung cấp</h1>
          <p className="text-slate-500 mt-1">Danh mục đối tác cung cấp hàng hóa cho toàn hệ thống</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-2"
        >
          <span>+ Thêm nhà cung cấp</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex max-w-md">
          <input
            type="text"
            placeholder="Tìm theo mã, tên hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            Đang tải dữ liệu...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            Không tìm thấy nhà cung cấp nào.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-semibold uppercase">
                  <th className="p-4">Mã NCC</th>
                  <th className="p-4">Tên nhà cung cấp</th>
                  <th className="p-4">Số điện thoại</th>
                  <th className="p-4">Địa chỉ</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-center w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSuppliers.map((ncc) => (
                  <tr key={ncc.MaNCC} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{ncc.MaNCC}</td>
                    <td className="p-4 font-medium text-indigo-600">{ncc.TenNCC}</td>
                    <td className="p-4">{ncc.DienThoai || <span className="text-slate-400 italic">Trống</span>}</td>
                    <td className="p-4 max-w-xs truncate">{ncc.DiaChi || <span className="text-slate-400 italic">Trống</span>}</td>
                    <td className="p-4">{ncc.Email || <span className="text-slate-400 italic">Trống</span>}</td>
                    <td className="p-4 text-center">
                      {ncc.TrangThai === 0 ? (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-100 rounded-full inline-block">
                          Ngừng hoạt động
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full inline-block">
                          Đang hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(ncc)}
                        className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                      >
                        Sửa
                      </button>
                      {ncc.TrangThai === 0 ? (
                        <button
                          onClick={() => handleReactivate(ncc)}
                          className="px-2.5 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors font-medium"
                        >
                          Kích hoạt
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteClick(ncc)}
                          className="px-2.5 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                        >
                          Ngừng HĐ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && nccToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-800">Ngừng hoạt động nhà cung cấp</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Bạn có chắc chắn muốn ngừng hoạt động nhà cung cấp <strong>{nccToDelete.TenNCC} ({nccToDelete.MaNCC})</strong>? 
              Nhà cung cấp này sẽ không hiển thị khi tạo phiếu nhập mới, nhưng thông tin trong lịch sử phiếu nhập cũ vẫn được lưu trữ.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setNccToDelete(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg font-medium text-sm transition-colors"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm shadow-red-200"
              >
                Xác nhận ngừng HĐ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {modalMode === "create" ? "Thêm Nhà Cung Cấp Mới" : `Sửa Nhà Cung Cấp: ${formData.maNCC}`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mã nhà cung cấp</label>
                <input
                  type="text"
                  value={formData.maNCC}
                  onChange={(e) => setFormData({ ...formData, maNCC: e.target.value })}
                  disabled={modalMode === "edit"}
                  placeholder="VD: NCC_VINAMILK"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên nhà cung cấp</label>
                <input
                  type="text"
                  value={formData.tenNCC}
                  onChange={(e) => setFormData({ ...formData, tenNCC: e.target.value })}
                  placeholder="VD: Công ty Cổ phần Sữa Việt Nam"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.dienThoai}
                  onChange={(e) => setFormData({ ...formData, dienThoai: e.target.value })}
                  placeholder="VD: 02854155555"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={formData.diaChi}
                  onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                  placeholder="VD: Số 10 Tân Trào, Tân Phú, Quận 7, TP. HCM"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="VD: vinamilk@vinamilk.com.vn"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
                >
                  {modalMode === "create" ? "Thêm mới" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
