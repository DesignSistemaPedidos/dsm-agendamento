import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'DSM Barber <onboarding@resend.dev>';

// ========== CONFIRMATION EMAIL ==========
export async function sendConfirmationEmail({ to, clientName, serviceName, barberName, date, time, price, appointmentId }) {
  const html = buildConfirmationHTML({ clientName, serviceName, barberName, date, time, price, appointmentId });

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `✅ Agendamento Confirmado — DSM Barber`,
    html,
  });

  if (error) {
    console.error('Email error:', error);
    return { success: false, error }; // Retorna objeto com erro detalhado
  }
  return { success: true, data };
}

// ========== REMINDER EMAIL ==========
export async function sendReminderEmail({ to, clientName, serviceName, barberName, date, time }) {
  const html = buildReminderHTML({ clientName, serviceName, barberName, date, time });

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `⏰ Lembrete: seu horário é daqui a 1 hora — DSM Barber`,
    html,
  });

  if (error) { console.error('Reminder email error:', error); return null; }
  return data;
}

// ========== CANCELLATION EMAIL ==========
export async function sendCancellationEmail({ to, clientName, serviceName, date, time }) {
  const html = buildCancellationHTML({ clientName, serviceName, date, time });

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `❌ Agendamento Cancelado — DSM Barber`,
    html,
  });

  if (error) { console.error('Cancel email error:', error); return null; }
  return data;
}

// ========== HTML TEMPLATES ==========

function baseStyles() {
  return `
    <style>
      body { margin:0; padding:0; background:#050508; font-family:'Segoe UI',Arial,sans-serif; color:#FAFAFA; }
      .container { max-width:520px; margin:0 auto; padding:32px 24px; }
      .card { background:#1A1A2E; border:1px solid rgba(212,168,83,0.2); border-radius:16px; padding:32px; margin:24px 0; }
      .logo { text-align:center; font-size:28px; font-weight:800; margin-bottom:8px; }
      .logo span { color:#D4A853; }
      .subtitle { text-align:center; color:#9CA3AF; font-size:14px; margin-bottom:32px; }
      .row { display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
      .row:last-child { border-bottom:none; }
      .label { color:#9CA3AF; font-size:14px; }
      .value { color:#FAFAFA; font-weight:600; font-size:14px; text-align:right; }
      .total { margin-top:16px; padding-top:16px; border-top:1px solid rgba(212,168,83,0.3); }
      .total .value { color:#D4A853; font-size:18px; font-weight:700; }
      .btn { display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#D4A853,#E5C475); color:#050508; font-weight:700; text-decoration:none; border-radius:10px; text-align:center; font-size:14px; }
      .footer { text-align:center; color:#6B7280; font-size:12px; margin-top:32px; line-height:1.6; }
      .icon { font-size:48px; text-align:center; margin-bottom:16px; }
      .success-badge { display:inline-block; background:rgba(34,197,94,0.12); color:#4ADE80; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:600; }
      .cancel-badge { display:inline-block; background:rgba(239,68,68,0.12); color:#F87171; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:600; }
    </style>
  `;
}

function buildConfirmationHTML({ clientName, serviceName, barberName, date, time, price, appointmentId }) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8">${baseStyles()}</head>
  <body>
    <div class="container">
      <div class="logo">✂️ <span>DSM Barber</span></div>
      <p class="subtitle">Seu agendamento foi confirmado</p>
      
      <div style="text-align:center; margin-bottom:24px;">
        <span class="success-badge">✅ Confirmado</span>
      </div>

      <div class="card">
        <div class="icon">💈</div>
        <p style="text-align:center; margin-bottom:24px; font-size:16px;">
          Olá, <strong>${clientName}</strong>!<br/>
          Te esperamos no horário marcado.
        </p>
        
        <div class="row">
          <span class="label">📋 Serviço</span>
          <span class="value">${serviceName}</span>
        </div>
        <div class="row">
          <span class="label">✂️ Profissional</span>
          <span class="value">${barberName}</span>
        </div>
        <div class="row">
          <span class="label">📅 Data</span>
          <span class="value">${date}</span>
        </div>
        <div class="row">
          <span class="label">🕐 Horário</span>
          <span class="value">${time}</span>
        </div>
        <div class="row total">
          <span class="label">💰 Valor</span>
          <span class="value">R$ ${price}</span>
        </div>
      </div>

      <div class="footer">
        <p>DSM Barber — Estilo e Tradição</p>
        <p>Este é um e-mail automático. Não responda.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

function buildReminderHTML({ clientName, serviceName, barberName, date, time }) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8">${baseStyles()}</head>
  <body>
    <div class="container">
      <div class="logo">✂️ <span>DSM Barber</span></div>
      <p class="subtitle">Lembrete do seu agendamento</p>

      <div class="card">
        <div class="icon">⏰</div>
        <p style="text-align:center; font-size:16px; margin-bottom:24px;">
          <strong>${clientName}</strong>, seu horário é <strong>daqui a 1 hora</strong>!
        </p>
        <div class="row">
          <span class="label">📋 Serviço</span>
          <span class="value">${serviceName}</span>
        </div>
        <div class="row">
          <span class="label">✂️ Profissional</span>
          <span class="value">${barberName}</span>
        </div>
        <div class="row">
          <span class="label">🕐 Horário</span>
          <span class="value">${time}</span>
        </div>
      </div>

      <div class="footer">
        <p>DSM Barber — Estilo e Tradição</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

function buildCancellationHTML({ clientName, serviceName, date, time }) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8">${baseStyles()}</head>
  <body>
    <div class="container">
      <div class="logo">✂️ <span>DSM Barber</span></div>
      <p class="subtitle">Agendamento cancelado</p>

      <div style="text-align:center; margin-bottom:24px;">
        <span class="cancel-badge">❌ Cancelado</span>
      </div>

      <div class="card">
        <p style="text-align:center; font-size:16px; margin-bottom:24px;">
          <strong>${clientName}</strong>, seu agendamento foi cancelado.
        </p>
        <div class="row">
          <span class="label">📋 Serviço</span>
          <span class="value">${serviceName}</span>
        </div>
        <div class="row">
          <span class="label">📅 Data</span>
          <span class="value">${date}</span>
        </div>
        <div class="row">
          <span class="label">🕐 Horário</span>
          <span class="value">${time}</span>
        </div>
      </div>

      <div style="text-align:center; margin-top:24px;">
        <a href="#" class="btn">Reagendar Horário</a>
      </div>

      <div class="footer">
        <p>DSM Barber — Estilo e Tradição</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
