const { hojeISO } = require('../config/jornada');
const R = require('../config/regras');
const E = require('../services/equipe');
const S = require('../services/rh');

const FILTROS = ['em_onboarding', 'concluidas', 'atrasadas'];

// O RH enxerga todos os colaboradores
function rota(fn) {
  return async (req, res) => {
    try {
      const colabs = await E.carregar();
      return await fn(req, res, { colabs, hoje: hojeISO() });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
    }
  };
}

// GET /rh/home
const home = rota(async (req, res, { colabs, hoje }) => {
  const status = colabs.map((c) => E.statusJornada(c, hoje));
  const { pendentes } = S.assinaturas(colabs);
  const gestores = await S.listarGestores();

  return res.json({
    contagens: {
      emOnboarding: status.filter((s) => S.passaNoFiltro(s, 'em_onboarding')).length,
      concluidas: status.filter((s) => S.passaNoFiltro(s, 'concluidas')).length,
      atrasadas: status.filter((s) => S.passaNoFiltro(s, 'atrasadas')).length,
      gestores: gestores.length,
    },
    assinaturasPendentes: pendentes.slice(0, S.DESTAQUE_ASSINATURAS_HOME),
    jornadasAtencao: new Set(pendentes.map((a) => a.colaboradorId)).size,
    eventos: await S.eventos(),
  });
});

// GET /rh/assinaturas
const assinaturas = rota(async (req, res, { colabs }) => res.json(S.assinaturas(colabs)));

// GET /rh/acompanhamento?filtro=em_onboarding|concluidas|atrasadas
const acompanhamento = rota(async (req, res, { colabs, hoje }) => {
  const filtro = FILTROS.includes(req.query.filtro) ? req.query.filtro : null;

  const itens = colabs
    .map((c) => {
      const { concluidas, total, percentual } = R.progresso(c.atividades);
      return {
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        dataInicio: c.dataInicio,
        dataFim: c.dataInicio ? R.dataFimJornada(c.dataInicio) : undefined,
        concluidas,
        total,
        percentual,
        status: E.statusJornada(c, hoje),
      };
    })
    .filter((i) => !filtro || S.passaNoFiltro(i.status, filtro));

  return res.json(itens);
});

// GET /rh/painel-gestores
const painelGestores = rota(async (req, res, { colabs, hoje }) => {
  const gestores = await S.listarGestores();
  return res.json(S.painel(colabs, gestores, hoje));
});

// POST /rh/documentos/:id/solicitar-assinatura
// Por enquanto só valida (como no front); o envio do lembrete fica para quando houver e-mail.
const solicitarAssinatura = rota(async (req, res, { colabs }) => {
  const c = colabs.find((x) => x.doc && x.doc.id === req.params.id);
  if (!c) return res.status(404).json({ erro: 'Documento não encontrado.' });
  if (c.doc.assinadoColaboradorEm && c.doc.assinadoGestorEm) {
    return res.status(409).json({ erro: 'Este documento já foi assinado.' });
  }
  return res.json({ ok: true });
});

module.exports = { home, assinaturas, acompanhamento, painelGestores, solicitarAssinatura };