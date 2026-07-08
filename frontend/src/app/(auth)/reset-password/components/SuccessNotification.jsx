import Link from "next/link";

export default function SuccessNotification() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-emerald-600 mb-4">Thành công!</h2>
      <p className="text-slate-600 mb-6">
        Mật khẩu của bạn đã được đặt lại. Bây giờ bạn có thể đăng nhập với mật khẩu mới.
      </p>
      <Link href="/" className="btn-primary w-full py-3">
        Quay về trang đăng nhập
      </Link>
    </div>
  );
}
