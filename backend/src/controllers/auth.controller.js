const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { VERSAO_TERMOS } = require('../config/termos');

const MAX_TENTATIVAS = 3;
const BLOQUEIO_MINUTOS = 15;

// Token e dados do usuário devolvidos ao app. `termos` no token diz se ele já aceitou a versão
// atual dos termos: sem isso, as rotas protegidas recusam o acesso (middlewares/auth.js).
function sessao(usuario) {
  const termosAceitos = usuario.termos_versao === VERSAO_TERMOS;
  const token = jwt.sign(
    { id: usuario.id_usuario, role: usuario.perfil_acesso, termos: termosAceitos },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
  return {
    token,
    usuario: {
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.perfil_acesso,
      termosAceitos,
      termosAceitosEm: termosAceitos ? usuario.termos_aceitos_em : null,
    },
  };
}

async function login(req, res) {
  const { role, email, senha } = req.body;

  if (!role || !email || !senha) {
    return res.status(400).json({ erro: 'Informe perfil, e-mail e senha.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT id_usuario, nome, email, senha, status, perfil_acesso, tentativas_falhas,
              termos_aceitos_em, termos_versao,
              (bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW()) AS bloqueado
         FROM usuario
        WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    const usuario = rows[0];
    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    if (usuario.bloqueado) {
      return res.status(423).json({
        erro: 'Conta bloqueada temporariamente por tentativas incorretas. Tente novamente mais tarde.',
      });
    }

    if (usuario.status !== 'ativo' || !usuario.senha) {
      return res.status(403).json({ erro: 'Conclua seu cadastro pelo link enviado por e-mail.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      const tentativas = usuario.tentativas_falhas + 1;

      if (tentativas >= MAX_TENTATIVAS) {
        await db.query(
          `UPDATE usuario
              SET tentativas_falhas = 0,
                  bloqueado_ate = DATE_ADD(NOW(), INTERVAL ? MINUTE)
            WHERE id_usuario = ?`,
          [BLOQUEIO_MINUTOS, usuario.id_usuario]
        );
        return res.status(423).json({
          erro: 'Conta bloqueada temporariamente por tentativas incorretas. Tente novamente mais tarde.',
        });
      }

      await db.query('UPDATE usuario SET tentativas_falhas = ? WHERE id_usuario = ?', [
        tentativas,
        usuario.id_usuario,
      ]);
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    if (usuario.perfil_acesso !== role) {
      return res.status(403).json({ erro: 'Este usuário não tem acesso ao perfil selecionado.' });
    }

    await db.query(
      'UPDATE usuario SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE id_usuario = ?',
      [usuario.id_usuario]
    );

    return res.json(sessao(usuario));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
}

function senhaValida(s) {
  return s.length >= 8 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s) && /[^A-Za-z0-9]/.test(s);
}

async function concluirConta(req, res) {
  const { email, token, senha } = req.body;

  if (!email || !token || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail, token e senha.' });
  }
  if (!senhaValida(senha)) {
    return res.status(400).json({
      erro: 'A senha deve ter 8 caracteres, com maiúscula, minúscula, número e caractere especial.',
    });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await db.query(
      `SELECT id_usuario FROM usuario
        WHERE email = ? AND token_convite = ? AND status = 'pendente' AND convite_expira_em > NOW()`,
      [email.trim().toLowerCase(), tokenHash]
    );
    if (rows.length === 0) {
      return res.status(400).json({ erro: 'Link inválido ou expirado.' });
    }

    const hash = await bcrypt.hash(senha, 10);
    await db.query(
      `UPDATE usuario
          SET senha = ?, status = 'ativo', token_convite = NULL, convite_expira_em = NULL
        WHERE id_usuario = ?`,
      [hash, rows[0].id_usuario]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
}

// POST /auth/aceitar-termos   { aceito: true }
// Registra o aceite (data e versão) e devolve um novo token, já liberado para as demais rotas.
async function aceitarTermos(req, res) {
  if (req.body.aceito !== true) {
    return res.status(400).json({ erro: 'É preciso aceitar os termos para continuar.' });
  }

  try {
    await db.query('UPDATE usuario SET termos_aceitos_em = NOW(), termos_versao = ? WHERE id_usuario = ?', [
      VERSAO_TERMOS,
      req.usuario.id,
    ]);
    const [rows] = await db.query(
      `SELECT id_usuario, nome, email, perfil_acesso, termos_aceitos_em, termos_versao
         FROM usuario WHERE id_usuario = ?`,
      [req.usuario.id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    return res.json(sessao(rows[0]));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
}

module.exports = { login, concluirConta, aceitarTermos };