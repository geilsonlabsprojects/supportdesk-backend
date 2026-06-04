const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // Configuração de CORS para permitir requisições de qualquer origem (como o GitHub Pages)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Lidar com requisições de Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Garantir que apenas requisições POST sejam aceitas
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const port = parseInt(process.env.SMTP_PORT || '587');
    
    // Configura o transporte de e-mail usando as suas variáveis de ambiente da Vercel
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // True apenas para a porta segura SSL 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Evita falhas de certificado SSL/TLS comuns
      }
    });

    await transporter.sendMail({
      from: `"Suporte" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body
    });

    return res.status(200).json({ message: 'Enviado!' });
  } catch (error) {
    console.error("Erro no envio SMTP:", error);
    return res.status(500).json({ error: 'Erro no servidor', details: error.message });
  }
}
