const db = require('../config/db');
const { hojeISO } = require('../config/jornada');
const R = require('../config/regras');
const E = require('../services/equipe');
const { registrarEvento } = require('../services/eventos');

const STATUS = ['concluida', 'atrasada', 'pendente', 'em_andamento'];

// Descobre o gestor logado, carrega a equipe dele e entrega pronto para cada endpoint
function rota(fn) {
  return async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT g.id_gestor, u.nome FROM gestor g JOIN usuario u ON u.id_usuario = g.id_usuario WHERE g.id_usuario = ?`,
        [req.usuario.id]
      );
      if (!rows[0]) return res.status(404).json({ erro: 'Gestor não encontrado.' });

      const colabs = await E.carregar({ idGestor: rows[0].id_gestor });
      return await fn(req, res, { gestor: rows[0], colabs, hoje: hojeISO() });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
    }
  };
}

// GET /minha-equipe/home
const home = rota(async (req, res, { gestor, colabs, hoje }) => {
  const equipe = E.montarEquipe(colabs, hoje);
  return res.json({
    equipe: equipe.slice(0, E.DESTAQUE_EQUIPE_HOME),
    totalEquipe: equipe.length,
    atencao: E.montarAtencao(colabs, gestor.nome, hoje).pendentes,
  });
});

// GET /minha-equipe/equipe?status=atrasada|pendente|em_andamento|concluida
const equipe = rota(async (req, res, { colabs, hoje }) => {
  const filtro = STATUS.includes(req.query.status) ? req.query.status : null;
  const itens = E.montarEquipe(colabs, hoje).filter((c) => !filtro || c.status === filtro);
  return res.json({ hoje, itens });
});

// GET /minha-equipe/atencao
const atencao = rota(async (req, res, { gestor, colabs, hoje }) => {
  return res.json(E.montarAtencao(colabs, gestor.nome, hoje));
});

// GET /minha-equipe/documentos/:id/assinatura  (tela de assinatura do gestor)
const telaAssinatura = rota(async (req, res, { colabs }) => {
  const c = colabs.find((x) => x.doc && x.doc.id === req.params.id);
  if (!c || E.pendenciaAssinatura(c) !== 'gestor') {
    return res.status(404).json({ erro: 'Documento não disponível para assinatura.' });
  }
  const { concluidas, total } = R.progresso(c.atividades);
  return res.json({
    documentoId: c.doc.id,
    titulo: E.TITULO_DOCUMENTO,
    nome: c.nome,
    cargo: c.cargo,
    inicio: c.dataInicio,
    fim: c.dataInicio ? R.dataFimJornada(c.dataInicio) : undefined,
    atividadesRealizadas: concluidas,
    total,
    semanas: R.resumoSemanas(c.atividades),
    assinaturaColaborador: { nome: c.doc.assinaturaColaborador ?? c.nome, data: c.doc.assinadoColaboradorEm },
  });
});

// POST /minha-equipe/documentos/:id/assinar   { nome }
const assinar = rota(async (req, res, { gestor, colabs, hoje }) => {
  const c = colabs.find((x) => x.doc && x.doc.id === req.params.id);
  if (!c) return res.status(404).json({ erro: 'Documento não encontrado.' });

  if (!c.atividades.every((a) => a.concluidaEm)) {
    return res.status(400).json({ erro: 'O colaborador ainda não concluiu todas as atividades.' });
  }
  if (!c.doc.assinadoColaboradorEm) {
    return res.status(400).json({ erro: 'O colaborador ainda não assinou este documento.' });
  }
  if (c.doc.assinadoGestorEm) return res.status(409).json({ erro: 'Você já assinou este documento.' });

  const nome = String(req.body.nome || '').trim().replace(/\s+/g, ' ');
  if (nome.split(' ').length < 2) return res.status(400).json({ erro: 'Digite seu nome completo para assinar.' });

  await db.query('UPDATE formulario SET assinatura_gestor = ?, data_assinatura = ? WHERE id_formulario = ?', [
    nome,
    hoje,
    c.doc.id,
  ]);
  await registrarEvento(`${gestor.nome} assinou o "${E.TITULO_DOCUMENTO}" de ${c.nome}.`);
  return res.json({ ok: true });
});

// POST /minha-equipe/colaboradores/:id/feedbacks   { texto }
const enviarFeedback = rota(async (req, res, { gestor, colabs, hoje }) => {
  const c = colabs.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ erro: 'Colaborador não encontrado na sua equipe.' });

  const texto = String(req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ erro: 'Escreva o feedback antes de enviar.' });
  if (texto.length > 2000) return res.status(400).json({ erro: 'O feedback pode ter no máximo 2000 caracteres.' });

  await db.query('INSERT INTO feedback (id_colaborador, id_gestor, texto, data) VALUES (?, ?, ?, ?)', [
    c.id,
    gestor.id_gestor,
    texto,
    hoje,
  ]);
  return res.status(201).json({ ok: true });
});

module.exports = { home, equipe, atencao, telaAssinatura, assinar, enviarFeedback };