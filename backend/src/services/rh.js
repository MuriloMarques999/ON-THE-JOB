const db = require('../config/db');
const R = require('../config/regras');
const E = require('./equipe');

// Quantas assinaturas aparecem em destaque na home do RH
const DESTAQUE_ASSINATURAS_HOME = 2;

const contagemVazia = () => ({ concluida: 0, em_andamento: 0, pendente: 0, atrasada: 0 });
const media = (valores) =>
  valores.length ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : 0;

// Mesma regra para os números da home e para a lista filtrada, para nunca divergirem
function passaNoFiltro(status, filtro) {
  if (filtro === 'concluidas') return status === 'concluida';
  if (filtro === 'atrasadas') return status === 'atrasada';
  return status !== 'concluida'; // em_onboarding
}

async function listarGestores() {
  const [rows] = await db.query(
    `SELECT g.id_gestor, u.nome, u.cargo
       FROM gestor g JOIN usuario u ON u.id_usuario = g.id_usuario
      ORDER BY g.id_gestor`
  );
  return rows.map((r) => ({ id: String(r.id_gestor), idNum: r.id_gestor, nome: r.nome, cargo: r.cargo ?? '' }));
}

async function eventos() {
  const [rows] = await db.query('SELECT id_evento, texto, data FROM evento ORDER BY data DESC, id_evento DESC LIMIT 20');
  return rows.map((r) => ({ id: String(r.id_evento), texto: r.texto, data: String(r.data).slice(0, 10) }));
}

// Tela "Assinatura de documentos" do RH: o termo só entra quando já está disponível para assinar
function assinaturas(colabs) {
  const assinados = [];
  const pendentes = [];

  for (const c of colabs) {
    if (!c.doc) continue;
    const quem = E.pendenciaAssinatura(c);
    const item = (data) => ({
      id: c.doc.id,
      colaboradorId: c.id,
      nome: c.nome,
      documento: E.TITULO_DOCUMENTO,
      colaborador: c.doc.assinadoColaboradorEm ? 'concluido' : 'pendente',
      gestor: c.doc.assinadoGestorEm ? 'concluido' : 'pendente',
      data,
    });

    if (quem) {
      // Espera desde que o termo ficou disponível (colaborador) ou desde que o colaborador assinou (gestor)
      pendentes.push(item(quem === 'colaborador' ? c.disponivelEm : c.doc.assinadoColaboradorEm));
    } else if (c.doc.assinadoColaboradorEm && c.doc.assinadoGestorEm) {
      assinados.push(item(c.doc.assinadoGestorEm));
    }
  }

  pendentes.sort((a, b) => a.data.localeCompare(b.data)); // quem espera há mais tempo primeiro
  assinados.sort((a, b) => b.data.localeCompare(a.data)); // mais recentes primeiro
  return { assinados, pendentes };
}

// Tela "Painel de Gestores": visão geral e a situação da equipe de cada gestor
function painel(colabs, gestores, hoje) {
  const lista = gestores
    .map((g) => {
      const doGestor = colabs.filter((c) => c.idGestor === g.idNum);
      const equipe = E.montarEquipe(doGestor, hoje);
      const porStatus = contagemVazia();
      equipe.forEach((c) => { porStatus[c.status] += 1; });
      const atencao = E.montarAtencao(doGestor, g.nome, hoje).pendentes;

      return {
        id: g.id,
        nome: g.nome,
        cargo: g.cargo,
        area: g.cargo, // o front usa o cargo quando não há área
        total: equipe.length,
        porStatus,
        progressoMedio: media(equipe.map((c) => c.percentual)),
        atrasados: porStatus.atrasada,
        feedbacksPendentes: atencao.filter((a) => a.tipo === 'feedback').length,
        assinaturasPendentes: atencao.filter((a) => a.tipo === 'assinatura').length,
        colaboradores: equipe.map((c) => ({
          id: c.id, nome: c.nome, cargo: c.cargo, percentual: c.percentual, status: c.status,
        })),
      };
    })
    .sort(
      (a, b) =>
        b.atrasados - a.atrasados ||
        b.feedbacksPendentes + b.assinaturasPendentes - (a.feedbacksPendentes + a.assinaturasPendentes) ||
        a.nome.localeCompare(b.nome)
    );

  const porStatus = contagemVazia();
  const percentuais = colabs.map((c) => {
    porStatus[E.statusJornada(c, hoje)] += 1;
    return R.progresso(c.atividades).percentual;
  });

  return {
    resumo: {
      gestores: gestores.length,
      colaboradores: colabs.length,
      progressoMedio: media(percentuais),
      atrasados: porStatus.atrasada,
      pendencias: lista.reduce((t, g) => t + g.feedbacksPendentes + g.assinaturasPendentes, 0),
      porStatus,
    },
    gestores: lista,
  };
}

module.exports = { DESTAQUE_ASSINATURAS_HOME, passaNoFiltro, listarGestores, eventos, assinaturas, painel };