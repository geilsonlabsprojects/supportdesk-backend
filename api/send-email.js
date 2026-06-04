const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  // Configuração de CORS para permitir requisições do GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Lidar com requisições Preflight do navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Garantir que apenas chamadas do tipo POST sejam aceites
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    // Configuração altamente compatível e robusta para evitar quedas de socket na Vercel
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'), // Converte a porta em número e usa 465 como fallback seguro
      secure: process.env.SMTP_PORT === '465', // Se a porta for 465 usa SSL direto, senão usa STARTTLS (como a 587)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // Limite de 10 segundos para estabelecer conexão inicial
      socketTimeout: 15000,     // Limite de 15 segundos para transferências
      greetingTimeout: 10000,   // Limite para aguardar a saudação do servidor SMTP
      tls: {
        // Ignora erros de certificados autoassinados e problemas de DNS comuns em servidores SMTP compartilhados
        rejectUnauthorized: false,
        ciphers: 'SSLv3' // Garante compatibilidade com protocolos de segurança legados se o provedor exigir
      }
    });

    // 1. Testa a ligação de forma segura para identificar se as credenciais estão corretas
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error("Erro na verificação de credenciais SMTP:", verifyError.message);
      throw new Error(`Falha na autenticação SMTP: ${verifyError.message}`);
    }

    // 2. Envia o e-mail real
    const mailOptions = {
      from: `"Suporte" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("E-mail enviado com sucesso. ID da mensagem:", info.messageId);

    return res.status(200).json({ message: 'Enviado com sucesso!', id: info.messageId });
  } catch (error) {
    console.error("Erro detalhado no Nodemailer:", error.message);
    return res.status(500).json({ 
      error: 'Erro na conexão com o servidor de e-mail', 
      detalhes: error.message 
    });
  }
}
