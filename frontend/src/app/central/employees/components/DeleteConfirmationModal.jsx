const DeleteConfirmationModal = function DeleteConfirmationModal({ employeeToDelete, selectedBranch, onConfirm, onClose, isOpen }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50 text-red-600">
          <h3 className="text-xl font-bold">Xác nhận xóa nhân sự</h3>
          <button onClick={onClose} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
        <div className="p-6">
          <p className="text-slate-700 mb-6 text-center">Bạn có chắc chắn muốn xóa nhân viên <strong className="text-slate-900">{employeeToDelete}</strong> tại chi nhánh {selectedBranch}? Dữ liệu sẽ được xóa khỏi phân mảnh tương ứng.</p>
          <div className="flex gap-3">
            <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex-1 transition-all">Xóa ngay</button>
            <button onClick={onClose} className="btn-ghost border flex-1 font-bold">Hủy bỏ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
