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
function buildEmail(code) {
  const subject = 'FitProgress — код підтвердження';
  const text = `Ваш код підтвердження: ${code}\n\nКод дійсний 10 хвилин. Якщо ви не реєструвались — проігноруйте цей лист.`;
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px;background:#0C0A14;border-radius:16px;color:#fff">
      <h2 style="margin:0 0 8px">FitProgress</h2>
      <p style="color:#b9b2cf;margin:0 0 20px">Код підтвердження email</p>
      <div style="font-size:36px;font-weight:800;letter-spacing:8px;background:#181522;border-radius:12px;padding:18px;text-align:center;color:#9A6BFF">${code}</div>
      <p style="color:#7c7593;font-size:13px;margin-top:20px">Код дійсний 10 хвилин.</p>
    </div>`;
  return { subject, text, html };
}

async function sendViaResend(email, code) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null; // not configured
  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'FitProgress <onboarding@resend.dev>';
  const { subject, text, html } = buildEmail(code);
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [email], subject, text, html }),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Resend ${resp.status}: ${detail.slice(0, 200)}`);
  }
  return true;
}

async function sendVerificationCode(email, code) {
  // 1) Resend API (preferred if configured)
  try {
    const r = await sendViaResend(email, code);
    if (r) { console.log(`📧 Verification code sent to ${email} via Resend`); return { delivered: true }; }
  } catch (err) {
    console.error('📧 Resend failed, will try SMTP / dev:', err.message);
  }

  // 2) SMTP (nodemailer)
  const tx = getTransporter();
  if (tx) {
    try {
      const from = process.env.SMTP_FROM || 'FitProgress <no-reply@fitprogress.app>';
      const { subject, text, html } = buildEmail(code);
      await tx.sendMail({ from, to: email, subject, text, html });
      console.log(`📧 Verification code sent to ${email} via SMTP`);
      return { delivered: true };
    } catch (err) {
      console.error('📧 SMTP send failed, falling back to dev code:', err.message);
    }
  }

  // 3) Dev fallback — return the code so the flow still works without email
  console.log(`📧 [DEV] Verification code for ${email}: ${code} (no email provider configured)`);
  return { delivered: false, devCode: code };
}

module.exports = { generateCode, sendVerificationCode };
