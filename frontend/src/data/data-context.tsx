import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth-context';

import {
  adicionarColaborador,
  adicionarGestor,
  type NovoColaborador,
  type NovoGestor,
  type ResultadoDb,
} from './mutations';
import {
  consultarHomeColaborador,
  consultarHomeGestor,
  consultarHomeRH,
  listarGestores,
} from './queries';
import { criarDbInicial } from './seed';
import type { Db, Pessoa } from './types';

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

export function useGestores() {
  const { db, viewer } = useData();
  return useMemo(() => listarGestores(db, viewer), [db, viewer]);
}

export function useCadastro() {
  const { cadastrarColaborador, cadastrarGestor } = useData();
  return { cadastrarColaborador, cadastrarGestor };
}
