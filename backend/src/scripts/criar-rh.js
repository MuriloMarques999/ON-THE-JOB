/*
 * Cria o PRIMEIRO usuário de RH (ou outro RH) de forma segura.
 * Use no banco de produção/AWS no lugar do seed-teste.js (que cria usuários de teste com senha fraca).
 *
 *   cd backend
 *   node src/scripts/criar-rh.js
 *
 * Pergunta nome, e-mail e senha na hora (nada fica gravado no código nem no histórico do terminal).
 * A senha precisa cumprir as mesmas regras do sistema e é guardada com hash (bcrypt).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const readline = require('readline');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMO_SENHA = 8; // mesma regra do cadastro de contas (ajustar aqui se o grupo mudar)

function erroSenha(senha) {
  if (senha.length < MINIMO_SENHA) return `A senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.`;
  if (!/[A-Z]/.test(senha)) return 'A senha precisa ter pelo menos 1 letra maiúscula.';
  if (!/[a-z]/.test(senha)) return 'A senha precisa ter pelo menos 1 letra minúscula.';
  if (!/\d/.test(senha)) return 'A senha precisa ter pelo menos 1 dígito numérico.';
  if (!/[^A-Za-z0-9]/.test(senha)) return 'A senha precisa ter pelo menos 1 caractere especial.';
  return null;
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  let oculto = false;
  rl._writeToOutput = (texto) => {
    if (!oculto) rl.output.write(texto);
  };
  const perguntar = (texto, esconder = false) =>
    new Promise((resolve) => {
      oculto = false;
      rl.question(texto, (resposta) => {
        if (esconder) rl.output.write('\n');
        oculto = false;
        resolve(resposta);
      });
      oculto = esconder;
    });

  try {
    const nome = (await perguntar('Nome completo do RH: ')).trim();
    if (nome.length < 3) throw new Error('Informe o nome completo.');

    const email = (await perguntar('E-mail: ')).trim();
    if (!EMAIL_RE.test(email)) throw new Error('Informe um e-mail válido.');

    const senha = await perguntar('Senha (não aparece enquanto digita): ', true);
    const problema = erroSenha(senha);
    if (problema) throw new Error(problema);
    const confirmacao = await perguntar('Repita a senha: ', true);
    if (senha !== confirmacao) throw new Error('As senhas não conferem.');

    const conexao = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    try {
      const [existe] = await conexao.query('SELECT id_usuario FROM usuario WHERE email = ?', [email]);
      if (existe.length > 0) throw new Error('Já existe um usuário com este e-mail. Nada foi alterado.');

      const hash = await bcrypt.hash(senha, 10);
      await conexao.query(
        "INSERT INTO usuario (nome, email, senha, status, perfil_acesso) VALUES (?, ?, ?, 'ativo', 'rh')",
        [nome, email, hash]
      );
      console.log(`\nRH criado com sucesso: ${nome} <${email}>`);
    } finally {
      await conexao.end();
    }
  } finally {
    rl.close();
  }
}

main().catch((erro) => {
  console.error(`\nErro: ${erro.message}`);
  process.exit(1);
});