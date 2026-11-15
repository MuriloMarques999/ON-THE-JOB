const crypto = require('crypto');
const db = require('../config/db');
const { criarAtividades, hojeISO } = require('../config/jornada');
const { registrarEvento } = require('../services/eventos');
const { enviarConvite } = require('../services/email');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function criar(req, res) {
  const { nome, email, telefone, cargo, gestorId } = req.body;
  if (!nome?.trim() || !email?.trim() || !cargo?.trim() || !gestorId) {
    return res.status(400).json({ erro: 'Informe nome, e-mail, cargo e gestor.' });
  }
  const emailNorm = email.trim().toLowerCase();
  if (!EMAIL_RE.test(emailNorm)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const conn = await db.getConnection();
  try {
    const [gestor] = await conn.query('SELECT id_gestor FROM gestor WHERE id_gestor = ?', [gestorId]);
    if (gestor.length === 0) {
      return res.status(404).json({ erro: 'Gestor responsável não encontrado.' });
    }

    await conn.beginTransaction();
    const [u] = await conn.query(
      `INSERT INTO usuario (nome, email, status, perfil_acesso, telefone, cargo, token_convite, convite_expira_em)
       VALUES (?, ?, 'pendente', 'colaborador', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [nome.trim(), emailNorm, telefone || null, cargo.trim(), tokenHash]
    );
    const [c] = await conn.query(
      'INSERT INTO colaborador (id_usuario, id_gestor) VALUES (?, ?)',
      [u.insertId, gestorId]
    );

    const inicio = hojeISO();
    const [o] = await conn.query(
      'INSERT INTO onboarding (id_colaborador, data_inicio) VALUES (?, ?)',
      [c.insertId, inicio]
    );

    // 25 atividades, cada uma com início e prazo próprios
    await conn.query(
      'INSERT INTO tarefa (id_onboarding, descricao, envolvidos, data_inicio, prazo) VALUES ?',
      [criarAtividades(inicio).map((a) => [o.insertId, a.titulo, a.envolvidos, a.inicio, a.prazo])]
    );

    // Termo de conclusão (documento a assinar)
    await conn.query('INSERT INTO formulario (id_onboarding, id_gestor) VALUES (?, ?)', [o.insertId, gestorId]);

    // Histórico exibido na home do RH
    await registrarEvento(`Convite enviado para ${nome.trim()} (${emailNorm}). Jornada de onboarding criada.`, conn);
    await enviarConvite({ nome: nome.trim(), email: emailNorm, perfil: 'colaborador', token });
    await conn.commit();

    return res.status(201).json({ id: String(c.insertId), nome: nome.trim(), email: emailNorm });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Já existe uma pessoa cadastrada com este e-mail.' });
    }
    if (e.codigo === 'RESEND_CONFIG ausente' || e.codigo === 'RESEND_ENVIO') {
      console.error(e);
      return res.status(502).json({ erro: 'Não foi possível enviar o convite por e-mail.' });
    }
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  } finally {
    conn.release();
  }
}

module.exports = { criar };