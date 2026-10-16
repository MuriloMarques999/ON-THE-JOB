import type { Atividade, Db, Documento, EventoAutomatico, Feedback, Pessoa, StatusJornada } from './types';

/*
 * CONSULTAS (leitura)
 * Aqui ficam as REGRAS DE VISIBILIDADE e os CÁLCULOS. No backend, tudo isto vira endpoints e roda
 * no servidor (que identifica quem pergunta pelo token de login):
 *   RH         -> vê todos os colaboradores
 *   Gestor     -> vê só os colaboradores ligados a ele
 *   Colaborador-> vê só a si mesmo
 */

export function colaboradoresVisiveis(db: Db, viewer: Pessoa): Pessoa[] {
  const colaboradores = db.pessoas.filter((p) => p.perfil === 'colaborador');
  if (viewer.perfil === 'rh') return colaboradores;
  if (viewer.perfil === 'gestor') return colaboradores.filter((p) => p.gestorId === viewer.id);
  return colaboradores.filter((p) => p.id === viewer.id);
}

export function listarGestores(db: Db, viewer: Pessoa | null): { id: string; nome: string }[] {
  if (viewer?.perfil !== 'rh') return [];
  return db.pessoas.filter((p) => p.perfil === 'gestor').map((g) => ({ id: g.id, nome: g.nome }));
}

/* ----------------------------- cálculos ----------------------------- */

const atividadesDe = (db: Db, id: string) => db.atividades.filter((a) => a.colaboradorId === id);
const documentosDe = (db: Db, id: string) => db.documentos.filter((d) => d.colaboradorId === id);

function progresso(atividades: Atividade[]) {
  const total = atividades.length;
  const concluidas = atividades.filter((a) => a.status === 'concluida').length;
  return { total, concluidas, percentual: total ? Math.round((concluidas / total) * 100) : 0 };
}

// O termo de conclusão só fica disponível quando todas as atividades estão concluídas.
function pendenciaAssinatura(doc: Documento, atividades: Atividade[]): 'colaborador' | 'gestor' | null {
  const disponivel = doc.tipo === 'ciencia' || atividades.every((a) => a.status === 'concluida');
  if (!disponivel) return null;
  if (!doc.assinadoColaboradorEm) return 'colaborador';
  if (!doc.assinadoGestorEm) return 'gestor';
  return null;
}

export function statusJornada(db: Db, colaboradorId: string): StatusJornada {
  const atividades = atividadesDe(db, colaboradorId);
  const documentos = documentosDe(db, colaboradorId);

  const tudoConcluido = atividades.length > 0 && atividades.every((a) => a.status === 'concluida');
  const documentosOk = documentos.every((d) => d.assinadoColaboradorEm && d.assinadoGestorEm);

  if (tudoConcluido && documentosOk) return 'concluida';
  if (atividades.some((a) => a.status === 'atrasada')) return 'atrasada';
  return 'em_andamento';
}

/* ------------------------------ RH ------------------------------ */

export interface HomeRH {
  contagens: { emOnboarding: number; concluidas: number; atrasadas: number; gestores: number };
  assinaturasPendentes: { id: string; colaboradorId: string; nome: string; quem: 'colaborador' | 'gestor' }[];
  jornadasAtencao: number;
  eventos: EventoAutomatico[];
  resumoGestores: { id: string; nome: string; area: string; totalColaboradores: number }[];
}

const RH_VAZIO: HomeRH = {
  contagens: { emOnboarding: 0, concluidas: 0, atrasadas: 0, gestores: 0 },
  assinaturasPendentes: [],
  jornadasAtencao: 0,
  eventos: [],
  resumoGestores: [],
};

export function consultarHomeRH(db: Db, viewer: Pessoa | null): HomeRH {
  if (!viewer || viewer.perfil !== 'rh') return RH_VAZIO;

  const colaboradores = colaboradoresVisiveis(db, viewer);
  const status = colaboradores.map((c) => statusJornada(db, c.id));
  const gestores = db.pessoas.filter((p) => p.perfil === 'gestor');

  const assinaturasPendentes = colaboradores.flatMap((c) => {
    const atividades = atividadesDe(db, c.id);
    return documentosDe(db, c.id).flatMap((doc) => {
      const quem = pendenciaAssinatura(doc, atividades);
      return quem ? [{ id: doc.id, colaboradorId: c.id, nome: c.nome, quem }] : [];
    });
  });

  return {
    contagens: {
      emOnboarding: status.filter((s) => s !== 'concluida').length,
      concluidas: status.filter((s) => s === 'concluida').length,
      atrasadas: status.filter((s) => s === 'atrasada').length,
      gestores: gestores.length,
    },
    assinaturasPendentes,
    jornadasAtencao: new Set(assinaturasPendentes.map((a) => a.colaboradorId)).size,
    eventos: [...db.eventos].sort((a, b) => b.data.localeCompare(a.data)),
    resumoGestores: gestores.map((g) => ({
      id: g.id,
      nome: g.nome,
      area: g.area ?? g.cargo,
      totalColaboradores: colaboradores.filter((c) => c.gestorId === g.id).length,
    })),
  };
}

/* --------------------------- Colaborador --------------------------- */

export interface HomeColaborador {
  concluidas: number;
  total: number;
  proximas: Atividade[];
  feedbacks: (Pick<Feedback, 'id' | 'texto' | 'data'> & { autor: string })[];
}

const COLABORADOR_VAZIO: HomeColaborador = { concluidas: 0, total: 0, proximas: [], feedbacks: [] };

export function consultarHomeColaborador(db: Db, viewer: Pessoa | null): HomeColaborador {
  if (!viewer || viewer.perfil !== 'colaborador') return COLABORADOR_VAZIO;

  const atividades = atividadesDe(db, viewer.id);
  const { concluidas, total } = progresso(atividades);

  return {
    concluidas,
    total,
    proximas: atividades.filter((a) => a.status !== 'concluida').slice(0, 2),
    feedbacks: db.feedbacks
      .filter((f) => f.colaboradorId === viewer.id)
      .map((f) => ({
        id: f.id,
        texto: f.texto,
        data: f.data,
        autor: db.pessoas.find((p) => p.id === f.gestorId)?.nome ?? 'Gestor',
      })),
  };
}

/* ------------------------------ Gestor ------------------------------ */

export interface HomeGestor {
  equipe: {
    id: string;
    nome: string;
    cargo: string;
    dataInicio?: string;
    percentual: number;
    pendencias: number;
    status: StatusJornada;
  }[];
  atencao: { id: string; colaboradorId: string; nome: string; cargo: string; data?: string; tipo: 'assinatura' | 'feedback' }[];
}

const GESTOR_VAZIO: HomeGestor = { equipe: [], atencao: [] };

export function consultarHomeGestor(db: Db, viewer: Pessoa | null): HomeGestor {
  if (!viewer || viewer.perfil !== 'gestor') return GESTOR_VAZIO;

  const colaboradores = colaboradoresVisiveis(db, viewer);

  const equipe = colaboradores.map((c) => {
    const { total, concluidas, percentual } = progresso(atividadesDe(db, c.id));
    return {
      id: c.id,
      nome: c.nome,
      cargo: c.cargo,
      dataInicio: c.dataInicio,
      percentual,
      pendencias: total - concluidas,
      status: statusJornada(db, c.id),
    };
  });

  const atencao = colaboradores.flatMap((c) => {
    const atividades = atividadesDe(db, c.id);
    const itens: HomeGestor['atencao'] = [];

    // Documentos que o colaborador já assinou e esperam a assinatura do gestor
    documentosDe(db, c.id).forEach((doc) => {
      if (pendenciaAssinatura(doc, atividades) === 'gestor') {
        itens.push({ id: `${doc.id}-ass`, colaboradorId: c.id, nome: c.nome, cargo: c.cargo, data: c.dataInicio, tipo: 'assinatura' });
      }
    });

    // Colaborador que ainda não recebeu nenhum feedback deste gestor
    const jaDeuFeedback = db.feedbacks.some((f) => f.colaboradorId === c.id && f.gestorId === viewer.id);
    if (!jaDeuFeedback) {
      itens.push({ id: `${c.id}-fb`, colaboradorId: c.id, nome: c.nome, cargo: c.cargo, data: c.dataInicio, tipo: 'feedback' });
    }

    return itens;
  });

  return { equipe, atencao };
}
