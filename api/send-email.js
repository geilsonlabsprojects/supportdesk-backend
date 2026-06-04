const nodemailer = require('nodemailer');

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
    // Configuração Otimizada para Vercel
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 465, // Alterado para 465 (SSL Implícito) para evitar quedas de socket
      secure: true, // Obrigatório true para porta 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Ajuda a evitar bloqueios de firewalls de provedores de e-mail
        rejectUnauthorized: false
      }
    });

    // 1. Verificar a ligação antes de enviar (Isto fará com que o erro no log seja mais claro)
    await transporter.verify();

    // 2. Enviar o e-mail
    await transporter.sendMail({
      from: `"Suporte" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body
    });

    return res.status(200).json({ message: 'Enviado com sucesso!' });
  } catch (error) {
    console.error("Erro detalhado no Nodemailer:", error);
    return res.status(500).json({ 
        error: 'Erro na conexão com o servidor de e-mail', 
        detalhes: error.message 
    });
  }
}
