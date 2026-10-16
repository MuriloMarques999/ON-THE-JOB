import { criarAtividades, criarDocumentos, hojeISO } from './jornada';
import type { Db, Pessoa } from './types';

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
      documentos: [...db.documentos, ...criarDocumentos(id)],
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
