import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth-context';

import {
  adicionarColaborador,
  adicionarGestor,
  assinarDocumento as registrarAssinatura,
  assinarDocumentoGestor as registrarAssinaturaGestor,
  concluirAtividade as registrarConclusao,
  enviarFeedback as registrarFeedback,
  iniciarAtividade as registrarInicio,
  solicitarAssinatura as registrarSolicitacao,
  type NovoColaborador,
  type NovoGestor,
  type ResultadoDb,
} from './mutations';
import {
  consultarAcompanhamento,
  consultarAssinaturaGestor,
  consultarAssinaturas,
  consultarAtencao,
  consultarAtividades,
  consultarDocumentos,
  consultarEquipe,
  consultarHomeColaborador,
  consultarHomeGestor,
  consultarHomeRH,
  consultarPainelGestores,
  listarGestores,
} from './queries';
import { criarDbInicial } from './seed';
import type { Db, FiltroJornada, Pessoa, StatusJornada } from './types';

/*
 * PONTE ENTRE AS TELAS E OS DADOS
 * As telas só usam os hooks exportados no fim deste arquivo (useHomeRH, useCadastro...).
 * Quando o backend existir, é aqui que as chamadas passam a ir para a API (com estados de
 * carregando/erro); as telas continuam usando os mesmos hooks.
 */

type Resultado = { ok: true } | { ok: false; error: string };

type DataContextType = {
  db: Db;
  viewer: Pessoa | null; // a pessoa do banco que corresponde ao usuário logado
  cadastrarColaborador: (dados: NovoColaborador) => Resultado;
  cadastrarGestor: (dados: NovoGestor) => Resultado;
  solicitarAssinatura: (documentoId: string) => Resultado;
  iniciarAtividade: (atividadeId: string) => Resultado;
  concluirAtividade: (atividadeId: string) => Resultado;
  assinarDocumento: (documentoId: string, nome: string) => Resultado;
  enviarFeedback: (colaboradorId: string, texto: string) => Resultado;
  assinarDocumentoGestor: (documentoId: string, nome: string) => Resultado;
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [db, setDb] = useState<Db>(criarDbInicial);

  // Liga o login ao cadastro de pessoas pelo e-mail
  const viewer = useMemo(
    () => (user ? (db.pessoas.find((p) => p.email.toLowerCase() === user.email.toLowerCase()) ?? null) : null),
    [db.pessoas, user]
  );

  const value = useMemo<DataContextType>(() => {
    function aplicar(resultado: ResultadoDb): Resultado {
      if ('erro' in resultado) return { ok: false, error: resultado.erro };
      setDb(resultado.db);
      return { ok: true };
    }

    return {
      db,
      viewer,
      cadastrarColaborador: (dados) => aplicar(adicionarColaborador(db, viewer, dados)),
      cadastrarGestor: (dados) => aplicar(adicionarGestor(db, viewer, dados)),
      solicitarAssinatura: (documentoId) => aplicar(registrarSolicitacao(db, viewer, documentoId)),
      iniciarAtividade: (id) => aplicar(registrarInicio(db, viewer, id)),
      concluirAtividade: (id) => aplicar(registrarConclusao(db, viewer, id)),
      assinarDocumento: (id, nome) => aplicar(registrarAssinatura(db, viewer, id, nome)),
      enviarFeedback: (id, texto) => aplicar(registrarFeedback(db, viewer, id, texto)),
      assinarDocumentoGestor: (id, nome) => aplicar(registrarAssinaturaGestor(db, viewer, id, nome)),
    };
  }, [db, viewer]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>');
  return ctx;
}

/* ---------------------- hooks usados pelas telas ---------------------- */

export function useHomeRH() {
  const { db, viewer } = useData();
  return useMemo(() => consultarHomeRH(db, viewer), [db, viewer]);
}

export function useHomeColaborador() {
  const { db, viewer } = useData();
  return useMemo(() => consultarHomeColaborador(db, viewer), [db, viewer]);
}

export function useHomeGestor() {
  const { db, viewer } = useData();
  return useMemo(() => consultarHomeGestor(db, viewer), [db, viewer]);
}

export function useEquipe(filtro?: StatusJornada) {
  const { db, viewer } = useData();
  return useMemo(() => consultarEquipe(db, viewer, filtro), [db, viewer, filtro]);
}

export function useAtencao() {
  const { db, viewer } = useData();
  return useMemo(() => consultarAtencao(db, viewer), [db, viewer]);
}

export function useAssinaturaGestor(documentoId?: string) {
  const { db, viewer } = useData();
  return useMemo(() => consultarAssinaturaGestor(db, viewer, documentoId), [db, viewer, documentoId]);
}

export function useAcoesGestor() {
  const { enviarFeedback, assinarDocumentoGestor } = useData();
  return { enviarFeedback, assinarDocumento: assinarDocumentoGestor };
}

export function usePainelGestores() {
  const { db, viewer } = useData();
  return useMemo(() => consultarPainelGestores(db, viewer), [db, viewer]);
}

export function useAcompanhamento(filtro?: FiltroJornada) {
  const { db, viewer } = useData();
  return useMemo(() => consultarAcompanhamento(db, viewer, filtro), [db, viewer, filtro]);
}

export function useAssinaturas() {
  const { db, viewer } = useData();
  return useMemo(() => consultarAssinaturas(db, viewer), [db, viewer]);
}

export function useAtividades() {
  const { db, viewer } = useData();
  return useMemo(() => consultarAtividades(db, viewer), [db, viewer]);
}

export function useAcoesAtividade() {
  const { iniciarAtividade, concluirAtividade } = useData();
  return { iniciar: iniciarAtividade, concluir: concluirAtividade };
}

export function useDocumentos() {
  const { db, viewer } = useData();
  return useMemo(() => consultarDocumentos(db, viewer), [db, viewer]);
}

export function useAssinarDocumento() {
  return useData().assinarDocumento;
}

export function useGestores() {
  const { db, viewer } = useData();
  return useMemo(() => listarGestores(db, viewer), [db, viewer]);
}

export function useCadastro() {
  const { cadastrarColaborador, cadastrarGestor } = useData();
  return { cadastrarColaborador, cadastrarGestor };
}

export function useSolicitarAssinatura() {
  return useData().solicitarAssinatura;
}