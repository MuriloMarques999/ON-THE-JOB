import { criarAtividades, criarDocumentos, hojeISO } from './jornada';
import type { Atividade, Db, Feedback, Pessoa } from './types';

/*
 * AÇÕES (escrita)
 * Cada função recebe quem está agindo (`viewer`) e confere a permissão — no backend essa checagem
 * é do servidor. Devolvem o novo "banco" ou um erro; nunca alteram o original.
 */

export type ResultadoDb = { db: Db } | { erro: string };

export interface NovoColaborador {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  gestorId: string;
}

export interface NovoGestor {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
}

const emailJaExiste = (db: Db, email: string) => db.pessoas.some((p) => p.email.toLowerCase() === email);

export function adicionarColaborador(db: Db, viewer: Pessoa | null, dados: NovoColaborador): ResultadoDb {
  if (viewer?.perfil !== 'rh') return { erro: 'Você não tem permissão para cadastrar colaboradores.' };

  const email = dados.email.trim().toLowerCase();
  if (emailJaExiste(db, email)) return { erro: 'Já existe uma pessoa cadastrada com este e-mail.' };
  if (!db.pessoas.some((p) => p.id === dados.gestorId && p.perfil === 'gestor'))
    return { erro: 'Gestor responsável não encontrado.' };

  const id = `c-${Date.now()}`; // no backend, o id é gerado pelo servidor
  const inicio = hojeISO();
  const nome = dados.nome.trim();

  const nova: Pessoa = {
    id,
    nome,
    email,
    telefone: dados.telefone,
    perfil: 'colaborador',
    cargo: dados.cargo.trim(),
    gestorId: dados.gestorId,
    dataInicio: inicio,
  };

  return {
    db: {
      ...db,
      pessoas: [...db.pessoas, nova],
      atividades: [...db.atividades, ...criarAtividades(id, inicio)],
      documentos: [...db.documentos, ...criarDocumentos(id, inicio)],
      eventos: [
        { id: `e-${Date.now()}`, texto: `Convite enviado para ${nome} (${email}). Jornada de onboarding criada.`, data: inicio },
        ...db.eventos,
      ],
    },
  };
}

export function adicionarGestor(db: Db, viewer: Pessoa | null, dados: NovoGestor): ResultadoDb {
  if (viewer?.perfil !== 'rh') return { erro: 'Você não tem permissão para cadastrar gestores.' };

  const email = dados.email.trim().toLowerCase();
  if (emailJaExiste(db, email)) return { erro: 'Já existe uma pessoa cadastrada com este e-mail.' };

  const nome = dados.nome.trim();
  const novo: Pessoa = {
    id: `g-${Date.now()}`,
    nome,
    email,
    telefone: dados.telefone,
    perfil: 'gestor',
    cargo: dados.cargo.trim(),
  };

  return {
    db: {
      ...db,
      pessoas: [...db.pessoas, novo],
      eventos: [
        { id: `e-${Date.now()}`, texto: `Convite enviado para o gestor ${nome} (${email}).`, data: hojeISO() },
        ...db.eventos,
      ],
    },
  };
}

// "Solicitar assinatura" (RH). Por enquanto só valida e NÃO envia nada.
// TODO backend: POST /documentos/:id/solicitar-assinatura (o servidor notifica a parte pendente).
export function solicitarAssinatura(db: Db, viewer: Pessoa | null, documentoId: string): ResultadoDb {
  if (viewer?.perfil !== 'rh') return { erro: 'Você não tem permissão para solicitar assinaturas.' };

  const doc = db.documentos.find((d) => d.id === documentoId);
  if (!doc) return { erro: 'Documento não encontrado.' };
  if (doc.assinadoColaboradorEm && doc.assinadoGestorEm) return { erro: 'Este documento já foi assinado.' };

  return { db };
}

/* ------------------ ações do colaborador nas atividades ------------------ */
// O colaborador NÃO altera o status: só registra que iniciou ou concluiu (com a data).
// O status é calculado (jornada.ts) a partir dessas datas e do prazo.
// Concluir é definitivo: não existe "desfazer".
// TODO backend: POST /atividades/:id/iniciar e /atividades/:id/concluir

function alterarAtividade(db: Db, viewer: Pessoa | null, id: string, alterar: (a: Atividade) => Atividade | string): ResultadoDb {
  if (viewer?.perfil !== 'colaborador') return { erro: 'Apenas o colaborador pode alterar as próprias atividades.' };

  const atual = db.atividades.find((a) => a.id === id);
  if (!atual || atual.colaboradorId !== viewer.id) return { erro: 'Atividade não encontrada.' };

  const novo = alterar(atual);
  if (typeof novo === 'string') return { erro: novo };

  return { db: { ...db, atividades: db.atividades.map((a) => (a.id === id ? novo : a)) } };
}

export function iniciarAtividade(db: Db, viewer: Pessoa | null, id: string, hoje: string = hojeISO()): ResultadoDb {
  return alterarAtividade(db, viewer, id, (a) => {
    if (a.concluidaEm) return 'Esta atividade já foi concluída.';
    if (a.iniciadaEm) return 'Esta atividade já foi iniciada.';
    if (hoje < a.inicio) return 'Esta atividade ainda não está disponível para início.';
    return { ...a, iniciadaEm: hoje };
  });
}

export function concluirAtividade(db: Db, viewer: Pessoa | null, id: string, hoje: string = hojeISO()): ResultadoDb {
  return alterarAtividade(db, viewer, id, (a) => {
    if (a.concluidaEm) return 'Esta atividade já foi concluída.';
    if (hoje < a.inicio) return 'Esta atividade ainda não está disponível.';
    return { ...a, iniciadaEm: a.iniciadaEm ?? hoje, concluidaEm: hoje };
  });
}

/* ------------------------ assinatura digital ------------------------ */
// O colaborador assina primeiro; depois o gestor (assinarDocumentoGestor, mais abaixo).
// TODO backend: POST /documentos/:id/assinar { nome } (o servidor registra data/hora e notifica o gestor)

export function assinarDocumento(
  db: Db,
  viewer: Pessoa | null,
  documentoId: string,
  nomeAssinatura: string,
  hoje: string = hojeISO()
): ResultadoDb {
  if (viewer?.perfil !== 'colaborador') return { erro: 'Apenas o colaborador pode assinar nesta etapa.' };

  const doc = db.documentos.find((d) => d.id === documentoId);
  if (!doc || doc.colaboradorId !== viewer.id) return { erro: 'Documento não encontrado.' };
  if (doc.assinadoColaboradorEm) return { erro: 'Você já assinou este documento.' };

  const atividades = db.atividades.filter((a) => a.colaboradorId === viewer.id);
  if (!atividades.every((a) => a.concluidaEm)) return { erro: 'Conclua todas as atividades antes de assinar.' };

  const nome = nomeAssinatura.trim().replace(/\s+/g, ' ');
  if (nome.split(' ').length < 2) return { erro: 'Digite seu nome completo para assinar.' };

  return {
    db: {
      ...db,
      documentos: db.documentos.map((d) =>
        d.id === documentoId ? { ...d, assinadoColaboradorEm: hoje, assinaturaColaborador: nome } : d
      ),
      eventos: [
        { id: `e-${Date.now()}`, texto: `${viewer.nome} assinou o "${doc.titulo}". Aguardando assinatura do gestor.`, data: hoje },
        ...db.eventos,
      ],
    },
  };
}

/* ------------------------- ações do gestor ------------------------- */

// Só mexe em colaboradores da própria equipe do gestor.
const daEquipe = (db: Db, gestor: Pessoa, colaboradorId: string) =>
  db.pessoas.find((p) => p.id === colaboradorId && p.perfil === 'colaborador' && p.gestorId === gestor.id);

// Feedback do gestor para o colaborador: fica no histórico do colaborador e na lista do gestor.
// TODO backend: POST /colaboradores/:id/feedbacks { texto }
export function enviarFeedback(
  db: Db,
  viewer: Pessoa | null,
  colaboradorId: string,
  texto: string,
  hoje: string = hojeISO()
): ResultadoDb {
  if (viewer?.perfil !== 'gestor') return { erro: 'Apenas o gestor pode enviar feedbacks.' };
  if (!daEquipe(db, viewer, colaboradorId)) return { erro: 'Colaborador não encontrado na sua equipe.' };

  const limpo = texto.trim();
  if (!limpo) return { erro: 'Escreva o feedback antes de enviar.' };

  const novo: Feedback = { id: `f-${Date.now()}`, colaboradorId, gestorId: viewer.id, texto: limpo, data: hoje };
  return { db: { ...db, feedbacks: [novo, ...db.feedbacks] } };
}

// Assinatura do gestor: só depois que o colaborador assinou o mesmo documento.
// TODO backend: POST /documentos/:id/assinar-gestor { nome }
export function assinarDocumentoGestor(
  db: Db,
  viewer: Pessoa | null,
  documentoId: string,
  nomeAssinatura: string,
  hoje: string = hojeISO()
): ResultadoDb {
  if (viewer?.perfil !== 'gestor') return { erro: 'Apenas o gestor pode assinar nesta etapa.' };

  const doc = db.documentos.find((d) => d.id === documentoId);
  const colaborador = doc && daEquipe(db, viewer, doc.colaboradorId);
  if (!doc || !colaborador) return { erro: 'Documento não encontrado.' };
  if (!db.atividades.filter((a) => a.colaboradorId === doc.colaboradorId).every((a) => a.concluidaEm))
  return { erro: 'O colaborador ainda não concluiu todas as atividades.' };
  if (!doc.assinadoColaboradorEm) return { erro: 'O colaborador ainda não assinou este documento.' };
  if (doc.assinadoGestorEm) return { erro: 'Você já assinou este documento.' };

  const nome = nomeAssinatura.trim().replace(/\s+/g, ' ');
  if (nome.split(' ').length < 2) return { erro: 'Digite seu nome completo para assinar.' };

  return {
    db: {
      ...db,
      documentos: db.documentos.map((d) =>
        d.id === documentoId ? { ...d, assinadoGestorEm: hoje, assinaturaGestor: nome } : d
      ),
      eventos: [
        { id: `e-${Date.now()}`, texto: `${viewer.nome} assinou o "${doc.titulo}" de ${colaborador.nome}.`, data: hoje },
        ...db.eventos,
      ],
    },
  };
}