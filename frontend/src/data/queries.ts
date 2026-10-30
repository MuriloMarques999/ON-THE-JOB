import { concluidaComAtraso, dataFimJornada, hojeISO, jaPodeIniciar, statusAtividade } from './jornada';
import type { Atividade, Db, Documento, EventoAutomatico, Feedback, FiltroJornada, ItemBiblioteca, Pessoa, StatusAssinatura, StatusAtividade, StatusJornada } from './types';

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
  const concluidas = atividades.filter((a) => !!a.concluidaEm).length;
  return { total, concluidas, percentual: total ? Math.round((concluidas / total) * 100) : 0 };
}

// Quem precisa assinar agora. O termo só fica disponível quando TODAS as atividades estão concluídas;
// o colaborador assina primeiro e só depois o gestor é chamado (nunca antes disso).
function pendenciaAssinatura(doc: Documento, atividades: Atividade[]): 'colaborador' | 'gestor' | null {
  const disponivel = atividades.length > 0 && atividades.every((a) => !!a.concluidaEm);
  if (!disponivel) return null;
  if (!doc.assinadoColaboradorEm) return 'colaborador';
  if (!doc.assinadoGestorEm) return 'gestor';
  return null;
}

export function statusJornada(db: Db, colaboradorId: string, hoje: string = hojeISO()): StatusJornada {
  const atividades = atividadesDe(db, colaboradorId);

  // A jornada está concluída quando TODAS as atividades foram concluídas. As assinaturas do termo são
  // uma etapa seguinte, acompanhada à parte (ver `assinaturaPendente`).
  if (atividades.length > 0 && atividades.every((a) => !!a.concluidaEm)) return 'concluida';
  if (atividades.some((a) => statusAtividade(a, hoje) === 'atrasada')) return 'atrasada';
  if (atividades.every((a) => !a.iniciadaEm && !a.concluidaEm)) return 'pendente'; // nada iniciado ainda
  return 'em_andamento';
}

// Mesma regra para os números da home e para a lista filtrada, para nunca divergirem.
function passaNoFiltro(status: StatusJornada, filtro: FiltroJornada) {
  if (filtro === 'concluidas') return status === 'concluida';
  if (filtro === 'atrasadas') return status === 'atrasada';
  return status !== 'concluida'; // em_onboarding
}

/* ------------------------------ RH ------------------------------ */

export interface HomeRH {
  contagens: { emOnboarding: number; concluidas: number; atrasadas: number; gestores: number };
  assinaturasPendentes: ItemAssinatura[]; // só as que esperam há mais tempo (destaque da home)
  jornadasAtencao: number;
  eventos: EventoAutomatico[];
}

const RH_VAZIO: HomeRH = {
  contagens: { emOnboarding: 0, concluidas: 0, atrasadas: 0, gestores: 0 },
  assinaturasPendentes: [],
  jornadasAtencao: 0,
  eventos: [],
};

export function consultarHomeRH(db: Db, viewer: Pessoa | null, hoje: string = hojeISO()): HomeRH {
  if (!viewer || viewer.perfil !== 'rh') return RH_VAZIO;

  const colaboradores = colaboradoresVisiveis(db, viewer);
  const status = colaboradores.map((c) => statusJornada(db, c.id, hoje));
  const gestores = db.pessoas.filter((p) => p.perfil === 'gestor');

  const { pendentes } = consultarAssinaturas(db, viewer);

  return {
    contagens: {
      emOnboarding: status.filter((s) => passaNoFiltro(s, 'em_onboarding')).length,
      concluidas: status.filter((s) => passaNoFiltro(s, 'concluidas')).length,
      atrasadas: status.filter((s) => passaNoFiltro(s, 'atrasadas')).length,
      gestores: gestores.length,
    },
    assinaturasPendentes: pendentes.slice(0, DESTAQUE_ASSINATURAS_HOME),
    jornadasAtencao: new Set(pendentes.map((a) => a.colaboradorId)).size,
    eventos: [...db.eventos].sort((a, b) => b.data.localeCompare(a.data)),
  };
}

// Quantas assinaturas aparecem em destaque no bloco "Assinaturas pendentes" da home
const DESTAQUE_ASSINATURAS_HOME = 2;

export interface ItemAssinatura {
  id: string; // id do documento
  colaboradorId: string;
  nome: string;
  documento: string; // título do documento
  colaborador: StatusAssinatura;
  gestor: StatusAssinatura;
  data: string; // pendente: desde quando espera a assinatura | assinado: quando foi concluído
}

export interface Assinaturas {
  assinados: ItemAssinatura[]; // mais recentes primeiro
  pendentes: ItemAssinatura[]; // quem espera há mais tempo primeiro
}

const ASSINATURAS_VAZIO: Assinaturas = { assinados: [], pendentes: [] };

// Tela "Assinatura de documentos" do RH. Um documento só entra na lista quando já está disponível
// para assinatura (o termo de conclusão espera todas as atividades concluídas).
export function consultarAssinaturas(db: Db, viewer: Pessoa | null): Assinaturas {
  if (!viewer || viewer.perfil !== 'rh') return ASSINATURAS_VAZIO;

  const assinados: ItemAssinatura[] = [];
  const pendentes: ItemAssinatura[] = [];

  for (const c of colaboradoresVisiveis(db, viewer)) {
    const atividades = atividadesDe(db, c.id);

    for (const doc of documentosDe(db, c.id)) {
      const quem = pendenciaAssinatura(doc, atividades);
      const item = (data: string): ItemAssinatura => ({
        id: doc.id,
        colaboradorId: c.id,
        nome: c.nome,
        documento: doc.titulo,
        colaborador: doc.assinadoColaboradorEm ? 'concluido' : 'pendente',
        gestor: doc.assinadoGestorEm ? 'concluido' : 'pendente',
        data,
      });

      if (quem) {
        // Espera desde que o documento ficou disponível (colaborador) ou desde que o colaborador assinou (gestor)
        pendentes.push(item(quem === 'colaborador' ? doc.criadoEm : (doc.assinadoColaboradorEm ?? doc.criadoEm)));
      } else if (doc.assinadoColaboradorEm && doc.assinadoGestorEm) {
        assinados.push(item(doc.assinadoGestorEm));
      }
    }
  }

  pendentes.sort((a, b) => a.data.localeCompare(b.data));
  assinados.sort((a, b) => b.data.localeCompare(a.data));
  return { assinados, pendentes };
}

export interface ItemAcompanhamento {
  id: string;
  nome: string;
  cargo: string;
  dataInicio?: string;
  dataFim?: string;
  concluidas: number;
  total: number;
  percentual: number;
  status: StatusJornada;
}

// Tela "Acompanhamento dos novos colaboradores" do RH (todos, ou filtrados pelo status da jornada).
export function consultarAcompanhamento(
  db: Db,
  viewer: Pessoa | null,
  filtro?: FiltroJornada,
  hoje: string = hojeISO()
): ItemAcompanhamento[] {
  if (!viewer || viewer.perfil !== 'rh') return [];

  return colaboradoresVisiveis(db, viewer)
    .map((c) => {
      const { concluidas, total, percentual } = progresso(atividadesDe(db, c.id));
      return {
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        dataInicio: c.dataInicio,
        dataFim: c.dataInicio ? dataFimJornada(c.dataInicio) : undefined,
        concluidas,
        total,
        percentual,
        status: statusJornada(db, c.id, hoje),
      };
    })
    .filter((item) => !filtro || passaNoFiltro(item.status, filtro));
}

/* --------------------------- Colaborador --------------------------- */

export interface ItemAtividade {
  id: string;
  semana: number;
  titulo: string;
  envolvidos: string;
  inicio: string;
  prazo: string;
  iniciadaEm?: string;
  concluidaEm?: string;
  status: StatusAtividade; // calculado
  comAtraso: boolean; // concluída depois do prazo
  podeIniciar: boolean; // a data de início já chegou
}

function paraItem(a: Atividade, hoje: string): ItemAtividade {
  return {
    id: a.id,
    semana: a.semana,
    titulo: a.titulo,
    envolvidos: a.envolvidos,
    inicio: a.inicio,
    prazo: a.prazo,
    iniciadaEm: a.iniciadaEm,
    concluidaEm: a.concluidaEm,
    status: statusAtividade(a, hoje),
    comAtraso: concluidaComAtraso(a),
    podeIniciar: jaPodeIniciar(a, hoje),
  };
}

export interface SemanaAtividades {
  semana: number;
  total: number;
  concluidas: number;
  atrasadas: number;
  atividades: ItemAtividade[];
}

export interface Atividades {
  hoje: string;
  total: number;
  concluidas: number;
  percentual: number;
  semanas: SemanaAtividades[];
}

// Tela "Atividades" do colaborador (só as dele), separada por semana.
export function consultarAtividades(db: Db, viewer: Pessoa | null, hoje: string = hojeISO()): Atividades {
  if (!viewer || viewer.perfil !== 'colaborador') return { hoje, total: 0, concluidas: 0, percentual: 0, semanas: [] };

  const doColaborador = atividadesDe(db, viewer.id);
  const itens = doColaborador.map((a) => paraItem(a, hoje));
  const numeros = Array.from(new Set(itens.map((i) => i.semana))).sort((a, b) => a - b);

  const semanas = numeros.map((semana) => {
    const atividades = itens.filter((i) => i.semana === semana);
    return {
      semana,
      total: atividades.length,
      concluidas: atividades.filter((i) => i.status === 'concluida').length,
      atrasadas: atividades.filter((i) => i.status === 'atrasada').length,
      atividades,
    };
  });

  const { concluidas, total, percentual } = progresso(doColaborador);
  return { hoje, total, concluidas, percentual, semanas };
}

export interface HomeColaborador {
  hoje: string;
  concluidas: number;
  total: number;
  percentual: number;
  todasConcluidas: boolean; // libera o acesso aos documentos
  proximas: ItemAtividade[];
  feedbacks: (Pick<Feedback, 'id' | 'texto' | 'data'> & { autor: string })[];
}

export function consultarHomeColaborador(db: Db, viewer: Pessoa | null, hoje: string = hojeISO()): HomeColaborador {
  if (!viewer || viewer.perfil !== 'colaborador')
    return { hoje, concluidas: 0, total: 0, percentual: 0, todasConcluidas: false, proximas: [], feedbacks: [] };

  const atividades = atividadesDe(db, viewer.id);
  const { concluidas, total, percentual } = progresso(atividades);

  // As 2 não concluídas com prazo mais próximo (atrasadas vêm primeiro, naturalmente)
  const proximas = atividades
    .filter((a) => !a.concluidaEm)
    .sort((a, b) => a.prazo.localeCompare(b.prazo))
    .slice(0, 2)
    .map((a) => paraItem(a, hoje));

  return {
    hoje,
    concluidas,
    total,
    percentual,
    todasConcluidas: total > 0 && concluidas === total,
    proximas,
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

export interface DocumentosColaborador {
  nome: string;
  cargo: string;
  inicio?: string;
  fim?: string;
  atividadesRealizadas: number;
  total: number;
  percentual: number;
  feedbacks: number; // por enquanto, os feedbacks já registrados pelo gestor (mock)
  liberado: boolean; // só depois de concluir todas as atividades
  documentoId?: string; // termo de conclusão a ser assinado
  assinaturaColaborador?: { nome: string; data: string };
  assinaturaGestor?: { nome: string; data: string };
  semanas: { semana: number; tema: string; atividades: string[] }[]; // atividades realizadas, por semana
  biblioteca: ItemBiblioteca[];
  termos?: { versao: string; aceitoEm: string }; // termos de uso / LGPD aceitos no primeiro acesso
}

const DOCUMENTOS_VAZIO: DocumentosColaborador = {
  nome: '',
  cargo: '',
  atividadesRealizadas: 0,
  total: 0,
  percentual: 0,
  feedbacks: 0,
  liberado: false,
  semanas: [],
  biblioteca: [],
};

// Tema de cada semana da jornada (aparece no resumo das atividades realizadas)
const TEMAS_SEMANA = [
  'Apresentação da empresa',
  'Integração com a equipe',
  'Aprendizado técnico',
  'Prática na área',
  'Avaliação e encerramento',
];

// Atividades realizadas (concluídas) agrupadas por semana, para o resumo do acompanhamento.
function resumoSemanas(atividades: Atividade[]) {
  const numeros = Array.from(new Set(atividades.map((a) => a.semana))).sort((a, b) => a - b);
  return numeros.map((semana) => ({
    semana,
    tema: TEMAS_SEMANA[semana - 1] ?? '',
    atividades: atividades.filter((a) => a.semana === semana && a.concluidaEm).map((a) => a.titulo),
  }));
}

// Tela "Documentos" do colaborador: resumo do acompanhamento, assinaturas e biblioteca.
export function consultarDocumentos(db: Db, viewer: Pessoa | null): DocumentosColaborador {
  if (!viewer || viewer.perfil !== 'colaborador') return DOCUMENTOS_VAZIO;

  const atividades = atividadesDe(db, viewer.id);
  const { concluidas, total, percentual } = progresso(atividades);
  const termo = documentosDe(db, viewer.id).find((d) => d.tipo === 'conclusao');

  const semanas = resumoSemanas(atividades);

  // O formulário de acompanhamento só passa a constar na biblioteca depois da assinatura do GESTOR.
  const formulario: ItemBiblioteca[] = termo?.assinadoGestorEm
    ? [{ id: `form-${viewer.id}`, titulo: 'Formulário On The Job', tipo: 'Institucional', formato: 'PDF', url: `/docs/formulario-${viewer.id}.pdf` }]
    : [];

  return {
    nome: viewer.nome,
    cargo: viewer.cargo,
    inicio: viewer.dataInicio,
    fim: viewer.dataInicio ? dataFimJornada(viewer.dataInicio) : undefined,
    atividadesRealizadas: concluidas,
    total,
    percentual,
    feedbacks: db.feedbacks.filter((f) => f.colaboradorId === viewer.id).length,
    liberado: total > 0 && concluidas === total,
    documentoId: termo?.id,
    assinaturaColaborador: termo?.assinadoColaboradorEm
      ? { nome: termo.assinaturaColaborador ?? viewer.nome, data: termo.assinadoColaboradorEm }
      : undefined,
    assinaturaGestor: termo?.assinadoGestorEm
      ? {
          nome: termo.assinaturaGestor ?? db.pessoas.find((p) => p.id === viewer.gestorId)?.nome ?? 'Gestor',
          data: termo.assinadoGestorEm,
        }
      : undefined,
    semanas,
    biblioteca: [...db.biblioteca, ...formulario],
  };
}

/* ------------------------------ Gestor ------------------------------ */

// Quantos colaboradores aparecem em destaque em "Minha equipe" na home
const DESTAQUE_EQUIPE_HOME = 3;
// Quantas atividades pendentes aparecem no resumo expansível de cada colaborador
const RESUMO_PENDENTES = 5;

export interface AtividadePendente {
  id: string;
  titulo: string;
  semana: number;
  status: StatusAtividade;
  prazo: string;
}

export interface ItemEquipe {
  id: string;
  nome: string;
  cargo: string;
  dataInicio?: string;
  dataFim?: string;
  concluidas: number;
  total: number;
  percentual: number;
  pendencias: number;
  atrasadas: number;
  status: StatusJornada;
  motivo: string | null; // por que merece atenção (null = sem alerta)
  assinaturaPendente: 'colaborador' | 'gestor' | null; // jornada concluída, mas o termo ainda espera assinatura
  atividadesPendentes: AtividadePendente[]; // as primeiras, atrasadas antes
  totalPendentes: number;
}

// Quem precisa de mais atenção vem primeiro: atrasados, depois quem nem começou,
// depois os em andamento (do menor para o maior progresso) e, por último, os concluídos.
const ORDEM_PRIORIDADE: Record<StatusJornada, number> = { atrasada: 0, pendente: 1, em_andamento: 2, concluida: 3 };

function porPrioridade(a: ItemEquipe, b: ItemEquipe) {
  if (ORDEM_PRIORIDADE[a.status] !== ORDEM_PRIORIDADE[b.status]) return ORDEM_PRIORIDADE[a.status] - ORDEM_PRIORIDADE[b.status];
  if (a.atrasadas !== b.atrasadas) return b.atrasadas - a.atrasadas; // mais atividades atrasadas primeiro
  return a.percentual - b.percentual; // menor progresso primeiro
}

// Só os colaboradores do gestor logado, já ordenados por prioridade.
function montarEquipe(db: Db, viewer: Pessoa, hoje: string): ItemEquipe[] {
  return colaboradoresVisiveis(db, viewer)
    .map((c) => {
      const atividades = atividadesDe(db, c.id);
      const { total, concluidas, percentual } = progresso(atividades);
      const status = statusJornada(db, c.id, hoje);

      const naoConcluidas = atividades
        .filter((a) => !a.concluidaEm)
        .sort((x, y) => x.prazo.localeCompare(y.prazo))
        .map((a) => ({ id: a.id, titulo: a.titulo, semana: a.semana, status: statusAtividade(a, hoje), prazo: a.prazo }));
      const atrasadas = naoConcluidas.filter((a) => a.status === 'atrasada').length;

      let motivo: string | null = null;
      if (status === 'atrasada') motivo = `${atrasadas} ${atrasadas === 1 ? 'atividade atrasada' : 'atividades atrasadas'}`;
      else if (status === 'pendente') motivo = 'Jornada ainda não iniciada';

      return {
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        dataInicio: c.dataInicio,
        dataFim: c.dataInicio ? dataFimJornada(c.dataInicio) : undefined,
        concluidas,
        total,
        percentual,
        pendencias: total - concluidas,
        atrasadas,
        status,
        motivo,
        assinaturaPendente: documentosDe(db, c.id).map((d) => pendenciaAssinatura(d, atividades)).find((q) => q !== null) ?? null,
        atividadesPendentes: naoConcluidas.slice(0, RESUMO_PENDENTES),
        totalPendentes: naoConcluidas.length,
      };
    })
    .sort(porPrioridade);
}

export interface Equipe {
  hoje: string;
  itens: ItemEquipe[];
}

// Tela "Acompanhamento da equipe" do gestor (todos os dele, ou filtrados pelo status).
export function consultarEquipe(db: Db, viewer: Pessoa | null, filtro?: StatusJornada, hoje: string = hojeISO()): Equipe {
  if (!viewer || viewer.perfil !== 'gestor') return { hoje, itens: [] };
  return { hoje, itens: montarEquipe(db, viewer, hoje).filter((c) => !filtro || c.status === filtro) };
}

/* ---- "Precisa da sua atenção" (feedbacks e assinaturas do gestor) ---- */

export interface ItemAtencao {
  id: string; // estável: `${colaboradorId}-fb`, `${documentoId}-ass` ou `fb-${feedbackId}`
  tipo: 'feedback' | 'assinatura';
  concluido: boolean; // false = pendente (aparece na home) | true = já resolvido (histórico)
  colaboradorId: string;
  nome: string;
  cargo: string;
  data?: string; // início da jornada (mostrado na home)
  inicio?: string;
  fim?: string;
  documentoId?: string;
  documentoTitulo?: string;
  assinaturaColaborador?: { nome: string; data: string };
  assinaturaGestor?: { nome: string; data: string };
  feedback?: { texto: string; data: string };
  quando: string; // para ordenar
}

export interface Atencao {
  pendentes: ItemAtencao[]; // quem espera há mais tempo primeiro
  historico: ItemAtencao[]; // feedbacks enviados e documentos assinados, mais recentes primeiro
}

const ATENCAO_VAZIA: Atencao = { pendentes: [], historico: [] };

// Tela "Documentos" do gestor e bloco da home. Regras (só colaboradores da equipe dele):
//  - feedback pendente: o colaborador ainda não recebeu nenhum feedback deste gestor
//  - assinatura pendente: o colaborador já assinou e falta o gestor
export function consultarAtencao(db: Db, viewer: Pessoa | null, hoje: string = hojeISO()): Atencao {
  if (!viewer || viewer.perfil !== 'gestor') return ATENCAO_VAZIA;

  const pendentes: ItemAtencao[] = [];
  const historico: ItemAtencao[] = [];

  for (const c of colaboradoresVisiveis(db, viewer)) {
    const atividades = atividadesDe(db, c.id);
    const base = {
      colaboradorId: c.id,
      nome: c.nome,
      cargo: c.cargo,
      data: c.dataInicio,
      inicio: c.dataInicio,
      fim: c.dataInicio ? dataFimJornada(c.dataInicio) : undefined,
    };

    for (const doc of documentosDe(db, c.id)) {
      const assinaturaColaborador = doc.assinadoColaboradorEm
        ? { nome: doc.assinaturaColaborador ?? c.nome, data: doc.assinadoColaboradorEm }
        : undefined;
      const assinaturaGestor = doc.assinadoGestorEm
        ? { nome: doc.assinaturaGestor ?? viewer.nome, data: doc.assinadoGestorEm }
        : undefined;
      const item = {
        ...base,
        id: `${doc.id}-ass`,
        tipo: 'assinatura' as const,
        documentoId: doc.id,
        documentoTitulo: doc.titulo,
        assinaturaColaborador,
        assinaturaGestor,
      };

      if (pendenciaAssinatura(doc, atividades) === 'gestor') {
        pendentes.push({ ...item, concluido: false, quando: doc.assinadoColaboradorEm ?? hoje });
      } else if (assinaturaColaborador && assinaturaGestor) {
        historico.push({ ...item, concluido: true, quando: assinaturaGestor.data });
      }
    }

    const feedbacks = db.feedbacks.filter((f) => f.colaboradorId === c.id && f.gestorId === viewer.id);
    if (feedbacks.length === 0) {
      pendentes.push({ ...base, id: `${c.id}-fb`, tipo: 'feedback', concluido: false, quando: c.dataInicio ?? hoje });
    }
    feedbacks.forEach((f) =>
      historico.push({ ...base, id: `fb-${f.id}`, tipo: 'feedback', concluido: true, feedback: { texto: f.texto, data: f.data }, quando: f.data })
    );
  }

  pendentes.sort((a, b) => a.quando.localeCompare(b.quando));
  historico.sort((a, b) => b.quando.localeCompare(a.quando));
  return { pendentes, historico };
}

export interface AssinaturaGestorTela {
  documentoId: string;
  titulo: string;
  nome: string; // colaborador
  cargo: string;
  inicio?: string;
  fim?: string;
  atividadesRealizadas: number;
  total: number;
  semanas: { semana: number; tema: string; atividades: string[] }[];
  assinaturaColaborador: { nome: string; data: string };
}

// Tela de assinatura do gestor. Devolve null quando ele não pode assinar este documento
// (não é da equipe dele, o colaborador ainda não assinou ou ele já assinou).
export function consultarAssinaturaGestor(db: Db, viewer: Pessoa | null, documentoId?: string): AssinaturaGestorTela | null {
  if (!viewer || viewer.perfil !== 'gestor' || !documentoId) return null;

  const doc = db.documentos.find((d) => d.id === documentoId);
  const colaborador = doc && colaboradoresVisiveis(db, viewer).find((c) => c.id === doc.colaboradorId);
  if (!doc || !colaborador) return null;

  const atividades = atividadesDe(db, colaborador.id);
  if (pendenciaAssinatura(doc, atividades) !== 'gestor' || !doc.assinadoColaboradorEm) return null;

  const { concluidas, total } = progresso(atividades);
  return {
    documentoId: doc.id,
    titulo: doc.titulo,
    nome: colaborador.nome,
    cargo: colaborador.cargo,
    inicio: colaborador.dataInicio,
    fim: colaborador.dataInicio ? dataFimJornada(colaborador.dataInicio) : undefined,
    atividadesRealizadas: concluidas,
    total,
    semanas: resumoSemanas(atividades),
    assinaturaColaborador: { nome: doc.assinaturaColaborador ?? colaborador.nome, data: doc.assinadoColaboradorEm },
  };
}

export interface HomeGestor {
  equipe: ItemEquipe[]; // só os de maior prioridade (destaque)
  totalEquipe: number;
  atencao: ItemAtencao[]; // só os pendentes
}

const GESTOR_VAZIO: HomeGestor = { equipe: [], totalEquipe: 0, atencao: [] };

export function consultarHomeGestor(db: Db, viewer: Pessoa | null, hoje: string = hojeISO()): HomeGestor {
  if (!viewer || viewer.perfil !== 'gestor') return GESTOR_VAZIO;

  const todos = montarEquipe(db, viewer, hoje);
  return {
    equipe: todos.slice(0, DESTAQUE_EQUIPE_HOME),
    totalEquipe: todos.length,
    atencao: consultarAtencao(db, viewer, hoje).pendentes,
  };
}

/* ------------------------- Painel de gestores (RH) ------------------------- */

export type ContagemStatus = Record<StatusJornada, number>;

export interface ItemPainelGestor {
  id: string;
  nome: string;
  cargo: string;
  area: string;
  total: number; // colaboradores da equipe
  porStatus: ContagemStatus;
  progressoMedio: number; // média do % de atividades concluídas da equipe
  atrasados: number; // colaboradores com jornada atrasada
  feedbacksPendentes: number; // colaboradores que ainda não receberam feedback deste gestor
  assinaturasPendentes: number; // termos que já esperam a assinatura DESTE gestor
  colaboradores: { id: string; nome: string; cargo: string; percentual: number; status: StatusJornada }[];
}

export interface PainelGestores {
  resumo: {
    gestores: number;
    colaboradores: number;
    progressoMedio: number;
    atrasados: number;
    pendencias: number; // feedbacks + assinaturas esperando algum gestor
    porStatus: ContagemStatus;
  };
  gestores: ItemPainelGestor[]; // quem mais precisa de atenção primeiro
}

const contagemVazia = (): ContagemStatus => ({ concluida: 0, em_andamento: 0, pendente: 0, atrasada: 0 });
const media = (valores: number[]) => (valores.length ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : 0);

const PAINEL_VAZIO: PainelGestores = {
  resumo: { gestores: 0, colaboradores: 0, progressoMedio: 0, atrasados: 0, pendencias: 0, porStatus: contagemVazia() },
  gestores: [],
};

// Tela "Painel de Gestores" do RH: visão geral e por gestor (cada gestor com a situação da própria equipe).
// TODO backend: GET /rh/painel-gestores
export function consultarPainelGestores(db: Db, viewer: Pessoa | null, hoje: string = hojeISO()): PainelGestores {
  if (!viewer || viewer.perfil !== 'rh') return PAINEL_VAZIO;

  const gestores: ItemPainelGestor[] = db.pessoas
    .filter((p) => p.perfil === 'gestor')
    .map((g) => {
      const equipe = montarEquipe(db, g, hoje); // a equipe vista pelo próprio gestor
      const porStatus = contagemVazia();
      equipe.forEach((c) => (porStatus[c.status] += 1));
      const atencao = consultarAtencao(db, g, hoje).pendentes;

      return {
        id: g.id,
        nome: g.nome,
        cargo: g.cargo,
        area: g.area ?? g.cargo,
        total: equipe.length,
        porStatus,
        progressoMedio: media(equipe.map((c) => c.percentual)),
        atrasados: porStatus.atrasada,
        feedbacksPendentes: atencao.filter((a) => a.tipo === 'feedback').length,
        assinaturasPendentes: atencao.filter((a) => a.tipo === 'assinatura').length,
        colaboradores: equipe.map((c) => ({ id: c.id, nome: c.nome, cargo: c.cargo, percentual: c.percentual, status: c.status })),
      };
    })
    .sort(
      (a, b) =>
        b.atrasados - a.atrasados ||
        b.feedbacksPendentes + b.assinaturasPendentes - (a.feedbacksPendentes + a.assinaturasPendentes) ||
        a.nome.localeCompare(b.nome)
    );

  const todos = colaboradoresVisiveis(db, viewer);
  const porStatus = contagemVazia();
  const percentuais = todos.map((c) => {
    porStatus[statusJornada(db, c.id, hoje)] += 1;
    return progresso(atividadesDe(db, c.id)).percentual;
  });

  return {
    resumo: {
      gestores: gestores.length,
      colaboradores: todos.length,
      progressoMedio: media(percentuais),
      atrasados: porStatus.atrasada,
      pendencias: gestores.reduce((t, g) => t + g.feedbacksPendentes + g.assinaturasPendentes, 0),
      porStatus,
    },
    gestores,
  };
}