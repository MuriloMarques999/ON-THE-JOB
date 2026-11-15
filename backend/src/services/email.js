const { Resend } = require('resend');

function escaparHtml(valor) {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function criarLinkConvite({ email, perfil, token }) {
  const base = (process.env.APP_URL || 'http://localhost:8081').replace(/\/+$/, '');
  const parametros = new URLSearchParams({ perfil, email, token });
  return `${base}/concluir-conta?${parametros.toString()}`;
}

async function enviarConvite({ nome, email, perfil, token }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    const erro = new Error('RESEND_API_KEY e RESEND_FROM precisam estar configuradas.');
    erro.codigo = 'RESEND_CONFIG ausente';
    throw erro;
  }

  const link = criarLinkConvite({ email, perfil, token });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const saudacao = escaparHtml(nome);
  let resultado;
  try {
    resultado = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [email],
      subject: 'Convite para concluir seu cadastro',
      html: `
        <p>Olá, ${saudacao}!</p>
        <p>Você foi convidado(a) para acessar a plataforma On The Job.</p>
        <p><a href="${link}">Clique aqui para concluir seu cadastro</a></p>
        <p>Este link é válido por 7 dias e pode ser usado uma única vez.</p>
      `,
    });
  } catch (e) {
    const erro = new Error(e.message || 'Não foi possível conectar ao Resend.');
    erro.codigo = 'RESEND_ENVIO';
    throw erro;
  }

  if (resultado.error) {
    const erro = new Error(resultado.error.message || 'O Resend recusou o envio do e-mail.');
    erro.codigo = 'RESEND_ENVIO';
    throw erro;
  }

  return { link, id: resultado.data?.id };
}

module.exports = { enviarConvite };
