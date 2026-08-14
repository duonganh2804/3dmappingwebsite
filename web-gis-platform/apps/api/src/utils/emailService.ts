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
        family: 4,
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
        family: 4,
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
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);">
          <!-- Brand Logo / Header -->
          <div style="margin-bottom: 32px; text-align: center;">
            <span style="font-size: 14px; font-weight: 700; letter-spacing: 0.15em; color: #0f172a; text-transform: uppercase;">SAOLATEK</span>
            <span style="font-size: 14px; font-weight: 400; letter-spacing: 0.15em; color: #64748b; text-transform: uppercase;"> | GIS</span>
          </div>
          
          <!-- Title -->
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center; letter-spacing: -0.01em;">
            Reset your password
          </h2>
          
          <!-- Description -->
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            Hello,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            We received a request to reset the password for your account associated with <span style="font-weight: 600; color: #0f172a;">${email}</span> on the SaolaGIS platform.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 32px;">
            Please click the button below to set up a new password. This link is secure and will expire in <strong>60 minutes</strong>.
          </p>
          
          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${resetLink}" style="background-color: #434bed; color: #ffffff; padding: 12px 32px; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <!-- Fallback Link -->
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 32px; word-break: break-all; text-align: left;">
            <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">If the button above doesn't work, copy and paste this URL into your browser:</p>
            <a href="${resetLink}" style="font-size: 11px; color: #434bed; text-decoration: none; font-family: monospace;">${resetLink}</a>
          </div>
          
          <!-- Notice -->
          <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 0;">
            If you did not make this request, you can safely ignore this email. Your account remains secure and no changes have been made.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 24px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            © 2026 SAOLATEK. All rights reserved.
          </p>
          <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">
            This is an automated security notification. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"SaolaGIS" <${smtpUser || COMPANY_EMAIL}>`,
      to: email,
      subject: `Reset your SaolaGIS password`,
      html: htmlContent,
    });

    console.log(`✅ [Nodemailer] Đã gửi email khôi phục mật khẩu thành công tới ${email}`);
    return true;
  } catch (err: any) {
    console.error(`❌ [Nodemailer Error] Không thể gửi email khôi phục mật khẩu: ${err.message}`);
    return false;
  }
}
