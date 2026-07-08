"use client";
import { useEffect, useState } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import { apiFetch } from "@/components/api"; //
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";
import EmployeePageHeader from "./components/EmployeePageHeader";
import EmployeeFormModal from "./components/EmployeeFormModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import EmployeeTable from "./components/EmployeeTable";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("HUE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();
  const { isOpen: isDeleteOpen, open: openDeleteModal, close: closeDeleteModal } = useModal();
  const load = async (branch = selectedBranch) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/employees?branch=${branch}`);
      setRows(Array.isArray(result.data) ? result.data : result);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const [form, setForm] = useState({ MaNV: "", HoTen: "", ChucVu: "", Email: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const showNotification = useToast();
  useEffect(() => {
    load(selectedBranch).catch(() => {});
  }, [selectedBranch]);

  const handleAdd = () => {
    setForm({ MaNV: "", HoTen: "", ChucVu: "", Email: "" });
    setIsEditing(false);
    openFormModal();
  };

  const handleEdit = (employee) => {
    if (!employee) return;
    setForm({ MaNV: employee.MaNV, HoTen: employee.HoTen, ChucVu: employee.ChucVu, Email: employee.Email || "" });
    setIsEditing(true);
    openFormModal();
  };

  const handleDelete = (employeeId) => {
    if (!employeeId) return;
    setEmployeeToDelete(employeeId);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    try {
      await apiFetch(`/api/employees/${employeeToDelete}?branch=${selectedBranch}`, { method: "DELETE" });
      closeDeleteModal();
      showNotification(`Đã xóa nhân viên ${employeeToDelete} thành công`, "success");
      load();
    } catch (err) { showNotification(err.message, "error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/employees/${form.MaNV}?branch=${selectedBranch}` : `/api/employees?branch=${selectedBranch}`;
      const payload = isEditing ? { HoTen: form.HoTen, ChucVu: form.ChucVu, Email: form.Email } : form;
      await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      showNotification(isEditing ? "Cập nhật nhân viên thành công" : "Thêm nhân viên mới thành công", "success");
      closeFormModal();
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  return (
    <CentralLayout active="employees">
      <div className="flex flex-col gap-6 w-full">
        <EmployeePageHeader
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          onAdd={handleAdd}
          onReload={() => load()}
          loading={loading}
        />

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Danh sách nhân viên tại {selectedBranch}</h2>
          </div>
          {loading ? (
            <p className="text-center py-10 text-slate-500">Đang truy vấn dữ liệu phân tán...</p>
          ) : (
            <EmployeeTable rows={rows} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </section>
      </div>

      {isFormOpen && (
        <EmployeeFormModal
          form={form}
          setForm={setForm}
          isEditing={isEditing}
          onClose={closeFormModal}
          handleSubmit={handleSubmit}
          isOpen={isFormOpen}
        />
      )}

      {isDeleteOpen && (
        <DeleteConfirmationModal
          employeeToDelete={employeeToDelete}
          selectedBranch={selectedBranch}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          isOpen={isDeleteOpen}
        />
      )}
    </CentralLayout>
  );
}
