const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: Number(process.env.EMAIL_PORT || 587) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // For Gmail, this should be an "App Password"
  },
});

/**
 * Gửi email reset mật khẩu
 * @param {string} toEmail - Email người nhận
 * @param {string} token - Token reset
 */
async function sendPasswordResetEmail(toEmail, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'DDBMS System'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: toEmail,
    subject: "Yêu cầu đặt lại mật khẩu cho tài khoản của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Yêu cầu đặt lại mật khẩu</h2>
        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Vui lòng nhấp vào liên kết bên dưới để tạo mật khẩu mới. Liên kết này sẽ hết hạn sau 15 phút.</p>
        <p style="margin: 20px 0;"><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a></p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };