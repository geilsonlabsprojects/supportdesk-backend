const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Configuração explícita de CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://geilsonlabsprojects.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Resposta rápida para o Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verifica se é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Parâmetros ausentes.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `\"Suporte\" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body.replace(/<[^>]+>/g, ''),
      html: body,
    });

    return res.status(200).json({ message: 'E-mail enviado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
