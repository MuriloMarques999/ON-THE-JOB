require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { criarAtividades, hojeISO, somarDias } = require('../config/jornada');

const usuarios = [
  { nome: 'Camila Rocha', email: 'rh@platform.com', perfil: 'rh' },
  { nome: 'João Vitor Nogueira', email: 'gestor@platform.com', perfil: 'gestor' },
  { nome: 'Anne Carlini', email: 'colaborador@platform.com', perfil: 'colaborador' },
];

// Jornada de teste da Anne: gestor João, início 10 dias atrás (algumas atividades já liberadas)
async function criarJornadaDeTeste() {
  const [u] = await db.query("SELECT id_usuario FROM usuario WHERE email = 'colaborador@platform.com'");
  const [g] = await db.query(
    `SELECT g.id_gestor FROM gestor g JOIN usuario x ON x.id_usuario = g.id_usuario
      WHERE x.email = 'gestor@platform.com'`
  );
  const [existe] = await db.query('SELECT id_colaborador FROM colaborador WHERE id_usuario = ?', [u[0].id_usuario]);
  if (existe.length > 0) return; // já criada

  const inicio = somarDias(hojeISO(), -10);
  const [c] = await db.query('INSERT INTO colaborador (id_usuario, id_gestor) VALUES (?, ?)', [u[0].id_usuario, g[0].id_gestor]);
  const [o] = await db.query('INSERT INTO onboarding (id_colaborador, data_inicio) VALUES (?, ?)', [c.insertId, inicio]);
  await db.query(
    'INSERT INTO tarefa (id_onboarding, descricao, envolvidos, data_inicio, prazo) VALUES ?',
    [criarAtividades(inicio).map((a) => [o.insertId, a.titulo, a.envolvidos, a.inicio, a.prazo])]
  );
  await db.query('INSERT INTO formulario (id_onboarding, id_gestor) VALUES (?, ?)', [o.insertId, g[0].id_gestor]);
}

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  for (const u of usuarios) {
    await db.query(
      `INSERT INTO usuario (nome, email, senha, status, perfil_acesso)
       VALUES (?, ?, ?, 'ativo', ?)
       ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha = VALUES(senha), status = 'ativo',
         perfil_acesso = VALUES(perfil_acesso), tentativas_falhas = 0, bloqueado_ate = NULL`,
      [u.nome, u.email, hash, u.perfil]
    );
  }

  await db.query(
    `INSERT IGNORE INTO gestor (id_usuario) SELECT id_usuario FROM usuario WHERE email = 'gestor@platform.com'`
  );

  await criarJornadaDeTeste();

  console.log('Usuários de teste criados.');
  await db.end();
}

main().catch((e) => { console.error(e); process.exit(1); });