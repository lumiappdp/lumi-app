import emailjs from '@emailjs/browser';

// ==================================================
// SERVIÇO DE DISPARO DE E-MAILS - LUMI APP (EMAILJS)
// Disparo gratuito e seguro de códigos OTP de recuperação de senha
// ==================================================

// Variáveis de ambiente configuradas com chaves públicas seguras e fallback para produção na Vercel
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_ptwmlqu';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_jxamnll';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'CC1CC7Ef7m23a_Zyq';

// Envia e-mail contendo código OTP de 6 dígitos para o usuário redefinir a senha
// @param {Object} params
// @param {string} params.email - Endereço de e-mail do destinatário
// @param {string} params.code - Código numérico de 6 dígitos gerado
// @returns {Promise<Object>}
export async function sendRecoveryOtpEmail({ email, code }) {
  // Parâmetros repassados ao Template criado no painel do EmailJS
  const templateParams = {
    to_email: email,
    otp_code: code,
    app_name: 'Lumi App',
  };

  // Envia via API do EmailJS usando a chave pública do cliente
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
}
