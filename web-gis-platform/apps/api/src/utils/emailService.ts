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
