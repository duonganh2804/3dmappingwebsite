import nodemailer from 'nodemailer';

const COMPANY_EMAIL = 'duongnguyen280403@gmail.com';

interface SendLeadNotificationParams {
  email: string;
  fullName?: string;
  jobTitle?: string;
  company?: string;
  phone?: string;
  message: string;
  source?: string;
}

export async function sendLeadNotificationEmail(lead: SendLeadNotificationParams) {
  try {
    // Config SMTP từ environment variables hoặc xài Ethereal / direct fallback
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    let transporter;

    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      // Fallback khi chưa gắn pass app Gmail: log định dạng chi tiết
      console.log(`\n======================================================`);
      console.log(`📧 [EMAIL SERVICE NOTIFICATION] Send to: ${COMPANY_EMAIL}`);
      console.log(`Subject: 🚀 Yêu cầu Demo Mới từ ${lead.email}`);
      console.log(`Details:`);
      console.log(`- Email doanh nghiệp: ${lead.email}`);
      console.log(`- Họ tên: ${lead.fullName || 'Chưa cung cấp'}`);
      console.log(`- Chức vụ / Công ty: ${lead.jobTitle || 'N/A'} - ${lead.company || 'N/A'}`);
      console.log(`- Số điện thoại: ${lead.phone || 'N/A'}`);
      console.log(`- Kênh biết đến: ${lead.source || 'N/A'}`);
      console.log(`- Nội dung ghi chú: ${lead.message}`);
      console.log(`======================================================\n`);
      return true;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0; border-b: 1px solid #334155; padding-bottom: 15px;">
          🚀 Yêu cầu Book a Demo Mới!
        </h2>
        <p style="color: #94a3b8; font-size: 14px;">Hệ thống vừa ghi nhận một khách hàng mới đăng ký yêu cầu trải nghiệm Demo 3D GIS Platform:</p>
        
        <table style="width: 100%; text-align: left; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #1e293b;">
            <th style="padding: 10px; color: #cbd5e1; width: 40%;">Email Doanh Nghiệp:</th>
            <td style="padding: 10px; color: #38bdf8; font-weight: bold;">${lead.email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <th style="padding: 10px; color: #cbd5e1;">Họ và Tên:</th>
            <td style="padding: 10px; color: #ffffff;">${lead.fullName || '—'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <th style="padding: 10px; color: #cbd5e1;">Chức vụ / Công ty:</th>
            <td style="padding: 10px; color: #ffffff;">${lead.jobTitle || '—'} ${lead.company ? `(${lead.company})` : ''}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <th style="padding: 10px; color: #cbd5e1;">Số điện thoại:</th>
            <td style="padding: 10px; color: #ffffff;">${lead.phone || '—'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #1e293b;">
            <th style="padding: 10px; color: #cbd5e1;">Kênh biết đến:</th>
            <td style="padding: 10px; color: #ffffff;">${lead.source || '—'}</td>
          </tr>
        </table>

        <div style="background: #1e293b; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <strong style="color: #38bdf8; display: block; margin-bottom: 5px;">Ghi chú / Yêu cầu chi tiết:</strong>
          <p style="margin: 0; color: #e2e8f0; font-size: 14px; white-space: pre-wrap;">${lead.message}</p>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 25px; text-align: center;">
          Thông tin này đã được tự động đồng bộ vào Admin Panel Quản lý Liên hệ của hệ thống 3D GIS Platform.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"3D GIS Platform" <${smtpUser || COMPANY_EMAIL}>`,
      to: COMPANY_EMAIL,
      subject: `[Demo Request] Yêu cầu Demo từ ${lead.email}`,
      html: htmlContent,
    });

    console.log(`✅ [Nodemailer] Đã gửi email thông báo thành công tới ${COMPANY_EMAIL}`);
    return true;
  } catch (err: any) {
    console.error(`❌ [Nodemailer Error] Không thể gửi email: ${err.message}`);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/#/reset-password?token=${token}`;

    let transporter;

    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      console.log(`\n======================================================`);
      console.log(`📧 [EMAIL SERVICE NOTIFICATION] Password Reset Requested`);
      console.log(`Send to: ${email}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log(`======================================================\n`);
      return true;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 1px solid #334155; padding-bottom: 15px; text-align: center;">
          🔒 Khôi Phục Mật Khẩu Tài Khoản
        </h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Xin chào,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này của bạn trên hệ thống 3D GIS Platform.</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Vui lòng nhấp vào nút bên dưới để tiến hành thiết lập mật khẩu mới (liên kết này có hiệu lực trong vòng 1 giờ):</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #38bdf8; color: #0f172a; padding: 12px 30px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 14px; display: inline-block;">
            Đặt Lại Mật Khẩu
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
          Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này một cách an sau. Mật khẩu của bạn vẫn sẽ được giữ nguyên mà không có bất kỳ thay đổi nào.
        </p>

        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 25px 0;" />
        
        <p style="font-size: 12px; color: #64748b; margin-top: 25px; text-align: center;">
          Đây là email tự động từ hệ thống 3D GIS Platform. Vui lòng không phản hồi lại email này.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"3D GIS Platform" <${smtpUser || COMPANY_EMAIL}>`,
      to: email,
      subject: `[3D GIS Platform] Yêu cầu đặt lại mật khẩu của bạn`,
      html: htmlContent,
    });

    console.log(`✅ [Nodemailer] Đã gửi email khôi phục mật khẩu thành công tới ${email}`);
    return true;
  } catch (err: any) {
    console.error(`❌ [Nodemailer Error] Không thể gửi email khôi phục mật khẩu: ${err.message}`);
    return false;
  }
}
