const db = require('../config/db');
const R = require('../config/regras');

const TITULO_DOCUMENTO = 'Termo de conclusão do onboarding';
const DESTAQUE_EQUIPE_HOME = 3;
const RESUMO_PENDENTES = 5;
const ORDEM = { atrasada: 0, pendente: 1, em_andamento: 2, concluida: 3 };

const dia = (v) => (v ? String(v).slice(0, 10) : undefined);

// Carrega colaboradores + atividades + termo + feedbacks (de um gestor, ou de todos se não passar idGestor)
async function carregar({ idGestor } = {}) {
  const [colabs] = await db.query(
    `SELECT c.id_colaborador, c.id_gestor, u.nome, u.cargo, o.id_onboarding, o.data_inicio
       FROM colaborador c
       JOIN usuario u ON u.id_usuario = c.id_usuario
       JOIN onboarding o ON o.id_colaborador = c.id_colaborador
      ${idGestor ? 'WHERE c.id_gestor = ?' : ''}
      ORDER BY c.id_colaborador`,
    idGestor ? [idGestor] : []
  );
  if (colabs.length === 0) return [];

  const onboardings = colabs.map((c) => c.id_onboarding);
  const ids = colabs.map((c) => c.id_colaborador);

  const [tarefas] = await db.query(
    `SELECT id_onboarding, id_tarefa, descricao, envolvidos, data_inicio, prazo, iniciada_em, data_conclusao
       FROM tarefa WHERE id_onboarding IN (?) ORDER BY id_tarefa`,
    [onboardings]
  );
  const [forms] = await db.query(
    `SELECT id_formulario, id_onboarding, assinatura_colaborador, data_assinatura_colaborador,
            assinatura_gestor, data_assinatura
       FROM formulario WHERE id_onboarding IN (?)`,
    [onboardings]
  );
  const [fbs] = await db.query(
    'SELECT id_feedback, id_colaborador, id_gestor, texto, data FROM feedback WHERE id_colaborador IN (?) ORDER BY id_feedback DESC',
    [ids]
  );

  return colabs.map((c) => {
    const atividades = tarefas
      .filter((t) => t.id_onboarding === c.id_onboarding)
      .map((t, i) => ({
        id: String(t.id_tarefa),
        semana: Math.floor(i / R.ATIVIDADES_POR_SEMANA) + 1,
        titulo: t.descricao,
        envolvidos: t.envolvidos,
        inicio: dia(t.data_inicio),
        prazo: dia(t.prazo),
        iniciadaEm: dia(t.iniciada_em),
        concluidaEm: dia(t.data_conclusao),
      }));

    const f = forms.find((x) => x.id_onboarding === c.id_onboarding);
    const todasConcluidas = atividades.length > 0 && atividades.every((a) => a.concluidaEm);

    return {
      id: String(c.id_colaborador),
      idGestor: c.id_gestor,
      nome: c.nome,
      cargo: c.cargo ?? '',
      dataInicio: dia(c.data_inicio),
      atividades,
      // disponivelEm: dia em que a última atividade foi concluída (o termo ficou disponível)
      disponivelEm: todasConcluidas ? atividades.map((a) => a.concluidaEm).sort().pop() : undefined,
      doc: f
        ? {
            id: String(f.id_formulario),
            assinadoColaboradorEm: dia(f.data_assinatura_colaborador),
            assinaturaColaborador: f.assinatura_colaborador || undefined,
            assinadoGestorEm: dia(f.data_assinatura),
            assinaturaGestor: f.assinatura_gestor || undefined,
          }
        : null,
      feedbacks: fbs
        .filter((x) => x.id_colaborador === c.id_colaborador)
        .map((x) => ({ id: String(x.id_feedback), gestorId: x.id_gestor, texto: x.texto, data: dia(x.data) })),
    };
  });
}

// Status da jornada, calculado (mesma regra do front)
function statusJornada(c, hoje) {
  const at = c.atividades;
  if (at.length > 0 && at.every((a) => a.concluidaEm)) return 'concluida';
  if (at.some((a) => R.statusAtividade(a, hoje) === 'atrasada')) return 'atrasada';
  if (at.every((a) => !a.iniciadaEm && !a.concluidaEm)) return 'pendente';
  return 'em_andamento';
}

// Quem precisa assinar agora: o termo só existe depois de TODAS as atividades; colaborador primeiro, gestor depois
function pendenciaAssinatura(c) {
  if (!c.doc || c.atividades.length === 0 || !c.atividades.every((a) => a.concluidaEm)) return null;
  if (!c.doc.assinadoColaboradorEm) return 'colaborador';
  if (!c.doc.assinadoGestorEm) return 'gestor';
  return null;
}

function itemEquipe(c, hoje) {
  const { total, concluidas, percentual } = R.progresso(c.atividades);
  const status = statusJornada(c, hoje);

  const naoConcluidas = c.atividades
    .filter((a) => !a.concluidaEm)
    .sort((x, y) => x.prazo.localeCompare(y.prazo))
    .map((a) => ({ id: a.id, titulo: a.titulo, semana: a.semana, status: R.statusAtividade(a, hoje), prazo: a.prazo }));
  const atrasadas = naoConcluidas.filter((a) => a.status === 'atrasada').length;

  let motivo = null;
  if (status === 'atrasada') motivo = `${atrasadas} ${atrasadas === 1 ? 'atividade atrasada' : 'atividades atrasadas'}`;
  else if (status === 'pendente') motivo = 'Jornada ainda não iniciada';

  return {
    id: c.id,
    nome: c.nome,
    cargo: c.cargo,
    dataInicio: c.dataInicio,
    dataFim: c.dataInicio ? R.dataFimJornada(c.dataInicio) : undefined,
    concluidas,
    total,
    percentual,
    pendencias: total - concluidas,
    atrasadas,
    status,
    motivo,
    assinaturaPendente: pendenciaAssinatura(c),
    atividadesPendentes: naoConcluidas.slice(0, RESUMO_PENDENTES),
    totalPendentes: naoConcluidas.length,
  };
}

// Atrasados primeiro, depois quem nem começou, depois em andamento (menor progresso antes), concluídos por último
function porPrioridade(a, b) {
  if (ORDEM[a.status] !== ORDEM[b.status]) return ORDEM[a.status] - ORDEM[b.status];
  if (a.atrasadas !== b.atrasadas) return b.atrasadas - a.atrasadas;
  return a.percentual - b.percentual;
}

const montarEquipe = (colabs, hoje) => colabs.map((c) => itemEquipe(c, hoje)).sort(porPrioridade);

// "Precisa da sua atenção" do gestor: feedback ainda não dado e assinatura que falta o gestor
function montarAtencao(colabs, nomeGestor, hoje) {
  const pendentes = [];
  const historico = [];

  for (const c of colabs) {
    const base = {
      colaboradorId: c.id,
      nome: c.nome,
      cargo: c.cargo,
      data: c.dataInicio,
      inicio: c.dataInicio,
      fim: c.dataInicio ? R.dataFimJornada(c.dataInicio) : undefined,
    };

    if (c.doc) {
      const assinaturaColaborador = c.doc.assinadoColaboradorEm
        ? { nome: c.doc.assinaturaColaborador ?? c.nome, data: c.doc.assinadoColaboradorEm }
        : undefined;
      const assinaturaGestor = c.doc.assinadoGestorEm
        ? { nome: c.doc.assinaturaGestor ?? nomeGestor, data: c.doc.assinadoGestorEm }
        : undefined;
      const item = {
        ...base,
        id: `${c.doc.id}-ass`,
        tipo: 'assinatura',
        documentoId: c.doc.id,
        documentoTitulo: TITULO_DOCUMENTO,
        assinaturaColaborador,
        assinaturaGestor,
      };

      if (pendenciaAssinatura(c) === 'gestor') {
        pendentes.push({ ...item, concluido: false, quando: c.doc.assinadoColaboradorEm ?? hoje });
      } else if (assinaturaColaborador && assinaturaGestor) {
        historico.push({ ...item, concluido: true, quando: assinaturaGestor.data });
      }
    }

    if (c.feedbacks.length === 0) {
      pendentes.push({ ...base, id: `${c.id}-fb`, tipo: 'feedback', concluido: false, quando: c.dataInicio ?? hoje });
    }
    c.feedbacks.forEach((f) =>
      historico.push({ ...base, id: `fb-${f.id}`, tipo: 'feedback', concluido: true, feedback: { texto: f.texto, data: f.data }, quando: f.data })
    );
  }

  pendentes.sort((a, b) => a.quando.localeCompare(b.quando));
  historico.sort((a, b) => b.quando.localeCompare(a.quando));
  return { pendentes, historico };
}

module.exports = {
  TITULO_DOCUMENTO,
  DESTAQUE_EQUIPE_HOME,
  carregar,
  statusJornada,
  pendenciaAssinatura,
  montarEquipe,
  montarAtencao,
};