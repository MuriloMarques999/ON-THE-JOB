const crypto = require('crypto');
const db = require('../config/db');
const { registrarEvento } = require('../services/eventos');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function listar(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT g.id_gestor AS id, u.nome
         FROM gestor g JOIN usuario u ON u.id_usuario = g.id_usuario
        ORDER BY u.nome`
    );
    return res.json(rows.map((r) => ({ id: String(r.id), nome: r.nome })));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
}

async function criar(req, res) {
  const { nome, email, telefone, cargo } = req.body;
  if (!nome?.trim() || !email?.trim() || !cargo?.trim()) {
    return res.status(400).json({ erro: 'Informe nome, e-mail e cargo.' });
  }
  const emailNorm = email.trim().toLowerCase();
  if (!EMAIL_RE.test(emailNorm)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [u] = await conn.query(
      `INSERT INTO usuario (nome, email, status, perfil_acesso, telefone, cargo, token_convite, convite_expira_em)
       VALUES (?, ?, 'pendente', 'gestor', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [nome.trim(), emailNorm, telefone || null, cargo.trim(), tokenHash]
    );
    const [g] = await conn.query('INSERT INTO gestor (id_usuario) VALUES (?)', [u.insertId]);

    // Histórico exibido na home do RH
    await registrarEvento(`Convite enviado para o gestor ${nome.trim()} (${emailNorm}).`, conn);
    await conn.commit();

    const base = process.env.APP_URL || 'http://localhost:8081';
    console.log(`Convite gestor: ${base}/concluir-conta?perfil=gestor&email=${encodeURIComponent(emailNorm).replace('%40', '@')}&token=${token}`);

    return res.status(201).json({ id: String(g.insertId), nome: nome.trim(), email: emailNorm });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Já existe uma pessoa cadastrada com este e-mail.' });
    }
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  } finally {
    conn.release();
  }
}

module.exports = { listar, criar };