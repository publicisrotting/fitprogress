const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (transporter !== null) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } else {
    transporter = false; // not configured
  }
  return transporter;
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

/**
 * Sends a verification code. Returns { delivered: boolean, devCode?: string }.
 * If SMTP is not configured, returns devCode so the dev flow still works.
 */
async function sendVerificationCode(email, code) {
  const tx = getTransporter();
  const from = process.env.SMTP_FROM || 'FitProgress <no-reply@fitprogress.app>';
  const subject = 'FitProgress — код підтвердження';
  const text = `Ваш код підтвердження: ${code}\n\nКод дійсний 10 хвилин. Якщо ви не реєструвались — проігноруйте цей лист.`;
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px;background:#0C0A14;border-radius:16px;color:#fff">
      <h2 style="margin:0 0 8px">FitProgress</h2>
      <p style="color:#b9b2cf;margin:0 0 20px">Код підтвердження email</p>
      <div style="font-size:36px;font-weight:800;letter-spacing:8px;background:#181522;border-radius:12px;padding:18px;text-align:center;color:#9A6BFF">${code}</div>
      <p style="color:#7c7593;font-size:13px;margin-top:20px">Код дійсний 10 хвилин.</p>
    </div>`;

  if (!tx) {
    console.log(`📧 [DEV] Verification code for ${email}: ${code} (SMTP not configured)`);
    return { delivered: false, devCode: code };
  }
  try {
    await tx.sendMail({ from, to: email, subject, text, html });
    console.log(`📧 Verification code sent to ${email}`);
    return { delivered: true };
  } catch (err) {
    console.error('📧 Email send failed, falling back to dev code:', err.message);
    return { delivered: false, devCode: code };
  }
}

module.exports = { generateCode, sendVerificationCode };
