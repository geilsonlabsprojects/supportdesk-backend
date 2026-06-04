const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Configuração explícita de CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // Ajuste para o seu domínio em produção
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Resposta rápida para o navegador antes do envio real (Preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Bloqueio de métodos que não sejam POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Dados em falta: to, subject e body são obrigatórios.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Suporte Portal Escolar" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body.replace(/<[^>]+>/g, ''),
      html: `<div style="font-family: sans-serif; padding: 20px;">${body}</div>`,
    });

    return res.status(200).json({ message: 'E-mail enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return res.status(500).json({ error: 'Falha ao processar o envio do e-mail.' });
  }
}
