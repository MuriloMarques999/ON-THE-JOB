const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/teste', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, banco: 'conectado' });
  } catch (e) {
    res.status(500).json({ ok: false, banco: 'sem conexão' });
  }
});

app.use('/auth', require('./routes/auth.routes'));
app.use('/gestores', require('./routes/gestores.routes'));
app.use('/colaboradores', require('./routes/colaboradores.routes'));
app.use('/minha-jornada', require('./routes/minha-jornada.routes'));
app.use('/minha-equipe', require('./routes/minha-equipe.routes'));
app.use('/rh', require('./routes/rh.routes'));

module.exports = app;