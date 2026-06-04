const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  // Cabeçalhos de Segurança CORS para permitir que o seu Painel HTML faça requisições
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manipulação de requisições de Preflight (OPTIONS) feita pelo navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permite apenas chamadas via POST para maior segurança
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const { to, subject, body } = req.body;

  // Validação simples dos campos requeridos
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Parâmetros ausentes (to, subject e body são obrigatórios).' });
  }

  try {
    // Configuração dinâmica do servidor SMTP usando variáveis de ambiente seguras na Vercel
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_PORT === '465' || !process.env.SMTP_PORT, // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Senha de aplicativo ou token do serviço SMTP
      },
    });

    // Envia o e-mail real
    const mailInfo = await transporter.sendMail({
      from: `"Suporte Portal Escolar" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: body.replace(/<[^>]+>/g, ''), // Fallback em texto plano sem tags HTML
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="padding-bottom: 20px; border-b: 1px solid #e2e8f0; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2563eb; font-size: 18px;">Central de Atendimento</h2>
          </div>
          <div style="white-space: pre-line;">
            ${body}
          </div>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            <p style="margin: 0;">Esta é uma notificação automática da nossa Central de Ajuda.</p>
            <p style="margin: 3px 0 0 0;">Por favor, não responda diretamente a este e-mail.</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'E-mail enviado com sucesso!', messageId: mailInfo.messageId });

  } catch (error) {
    console.error('Erro SMTP:', error);
    return res.status(500).json({ error: 'Erro de conexão com o servidor de e-mail.', details: error.message });
  }
}
