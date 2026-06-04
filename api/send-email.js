const nodemailer = require('nodemailer');

// Alterado de 'export default' para 'module.exports' para alinhar ao CommonJS
module.exports = async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Lidar com Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Garantir que apenas POST seja aceito
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false, // false para a porta 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Suporte" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body
    });

    return res.status(200).json({ message: 'Enviado!' });
  } catch (error) {
    // Crucial: Exibe o erro real no painel de Logs da Vercel para debug
    console.error("Erro detalhado no transporte SMTP:", error); 
    return res.status(500).json({ error: 'Erro no servidor', detalhes: error.message });
  }
}
