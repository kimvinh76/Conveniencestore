"use client";
import { forwardRef } from "react";

const BranchDeleteConfirmationModal = forwardRef(function BranchDeleteConfirmationModal({ employeeToDelete, onConfirm, onClose }, ref) {
  return (
    <dialog ref={ref} className="modal w-full max-w-sm bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50 text-red-600">
        <h3 className="text-xl font-bold">Xác nhận xóa nhân viên</h3>
        <button onClick={onClose} className="text-red-400 hover:text-red-600 font-bold">✕</button>
      </div>
      <div className="p-6">
        <p className="text-slate-700 mb-6 text-center">Bạn có chắc chắn muốn xóa nhân viên <strong className="text-slate-900">{employeeToDelete?.HoTen} ({employeeToDelete?.MaNV})</strong>?</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex-1 transition-all">Xóa ngay</button>
          <button onClick={onClose} className="btn-ghost border flex-1 font-bold">Hủy bỏ</button>
        </div>
      </div>
    </dialog>
  );
});

export default BranchDeleteConfirmationModal;