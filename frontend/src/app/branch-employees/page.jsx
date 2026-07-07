"use client";
import { useEffect, useState } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import { useBranch } from "@/components/useBranch";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/contexts/ToastContext";
import BranchEmployeePageHeader from "./components/BranchEmployeePageHeader";
import BranchEmployeeTable from "./components/BranchEmployeeTable";
import BranchEmployeeFormModal from "./components/BranchEmployeeFormModal";
import BranchDeleteConfirmationModal from "./components/BranchDeleteConfirmationModal";

export default function Page() {
  const { branch, auth } = useBranch({ requireLocal: true });
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ MaNV: "", HoTen: "", ChucVu: "", Email: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const showNotification = useToast();
  const canManage = auth?.role === "ADMIN_CHI_NHANH" || auth?.role === "ADMIN_TOAN_BO";

  const { modalRef: formModalRef, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { modalRef: deleteModalRef, openModal: showDeleteModal, closeModal: closeDeleteModal } = useModal();

  const loadEmployees = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/employees?branch=${branch}`);
      setEmployees(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees().catch(() => {});
  }, [branch]);

  const openAddModal = () => {
    setForm({ MaNV: "", HoTen: "", ChucVu: "", Email: "" });
    setIsEditing(false);
    openFormModal();
  };

  const openEditModal = (emp) => {
    setForm({ MaNV: emp.MaNV, HoTen: emp.HoTen, ChucVu: emp.ChucVu, Email: emp.Email || "" });
    setIsEditing(true);
    openFormModal();
  };

  const openDeleteModal = (emp) => {
    setEmployeeToDelete(emp);
    showDeleteModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branch) return;
    try {
      const payload = { ...form, branch };
      if (isEditing) {
        await apiFetch(`/api/employees/${form.MaNV}?branch=${branch}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ HoTen: payload.HoTen, ChucVu: payload.ChucVu, Email: payload.Email }),
        });
      } else {
        await apiFetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      showNotification(isEditing ? "Cập nhật nhân viên thành công" : "Thêm nhân viên thành công", "success");
      closeFormModal();
      loadEmployees();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const confirmDelete = async () => {
    if (!employeeToDelete || !branch) return;
    try {
      await apiFetch(`/api/employees/${employeeToDelete.MaNV}?branch=${branch}`, {
        method: "DELETE",
      });
      showNotification(`Đã xóa nhân viên ${employeeToDelete.MaNV}`, "success");
      closeDeleteModal();
      loadEmployees();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  return (
    <BranchLayout active="employees">
      <div className="flex flex-col gap-6 w-full">
        <BranchEmployeePageHeader
          onAdd={openAddModal}
          onReload={loadEmployees}
          loading={loading}
          canManage={canManage}
        />

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
          <h2 className="text-xl font-bold text-slate-800 mb-5">Danh sách nhân viên</h2>
          {loading ? (
            <p className="text-center py-10 text-slate-500">Đang tải danh sách...</p>
          ) : (
            <BranchEmployeeTable
              employees={employees}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              canManage={canManage}
            />
          )}
        </section>
      </div>

      {canManage && (
        <>
          <BranchEmployeeFormModal
            ref={formModalRef}
            form={form}
            setForm={setForm}
            isEditing={isEditing}
            handleSubmit={handleSubmit}
            onClose={closeFormModal}
          />
          <BranchDeleteConfirmationModal
            ref={deleteModalRef}
            employeeToDelete={employeeToDelete}
            onConfirm={confirmDelete}
            onClose={closeDeleteModal}
          />
        </>
      )}
    </BranchLayout>
  );
}