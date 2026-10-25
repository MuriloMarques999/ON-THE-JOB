const db = require('../config/db');
const { hojeISO } = require('../config/jornada');

// Guarda uma linha no histórico de eventos (aparece na home do RH).
// "conexao" é opcional: passe a conexão da transação para gravar junto com ela.
async function registrarEvento(texto, conexao = db) {
  await conexao.query('INSERT INTO evento (texto, data) VALUES (?, ?)', [texto, hojeISO()]);
}

module.exports = { registrarEvento };