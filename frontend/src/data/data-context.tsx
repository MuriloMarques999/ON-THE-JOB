import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/context/auth-context';
import { api } from '@/services/api';

import { hojeISO } from './jornada';
import type { NovoColaborador, NovoGestor } from './mutations';
import type {
  Assinaturas,
  AssinaturaGestorTela,
  Atencao,
  Atividades,
  DocumentosColaborador,
  Equipe,
  HomeColaborador,
  HomeGestor,
  HomeRH,
  ItemAcompanhamento,
  PainelGestores,
} from './queries';
import type { DadosConclusao } from '@/services/pdf/conclusao';

import type { FiltroJornada, StatusJornada } from './types';

/*
 * PONTE ENTRE AS TELAS E A API
 * As telas só usam os hooks exportados no fim deste arquivo (useHomeRH, useCadastro...), que agora
 * buscam os dados no backend. As regras (visibilidade por perfil, status calculado pelas datas,
 * validações) rodam no SERVIDOR, que identifica quem pergunta pelo token de login.
 *
 *  - Leituras: cada hook chama um endpoint GET e devolve o mesmo formato de antes. Enquanto a resposta
 *    não chega, devolve um valor "vazio" (números zerados, listas vazias), então as telas não mudam.
 *  - Ações: devolvem uma Promise com { ok: true } ou { ok: false, error }. Quando dá certo, todas as
 *    leituras abertas são recarregadas, para as telas refletirem o que mudou.
 */

type Resultado = { ok: true } | { ok: false; error: string };

type DataContextType = {
  sessao: string; // muda quando alguém entra ou sai: descarta os dados da sessão anterior
  versao: number; // sobe a cada ação bem-sucedida: as leituras abertas recarregam
  executar: (caminho: string, corpo?: unknown) => Promise<Resultado>;
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [versao, setVersao] = useState(0);
  const sessao = user ? `${user.role}:${user.email}` : '';

  const executar = useCallback(async (caminho: string, corpo?: unknown): Promise<Resultado> => {
    const r = await api.post(caminho, corpo);
    if (!r.ok) return { ok: false, error: r.erro };
    setVersao((v) => v + 1);
    return { ok: true };
  }, []);

  const value = useMemo<DataContextType>(() => ({ sessao, versao, executar }), [sessao, versao, executar]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>');
  return ctx;
}

/* ---------------------- leitura genérica (GET) ---------------------- */

// Busca `caminho` na API. Mantém o dado anterior enquanto recarrega (sem piscar a tela) e só
// descarta quando muda o caminho (ex.: outro filtro) ou a sessão (outro usuário).
function useConsulta<T>(caminho: string | null) {
  const { sessao, versao } = useData();
  const chave = caminho && sessao ? `${sessao}|${caminho}` : '';
  const [estado, setEstado] = useState<{ chave: string; dados: T | null; pronto: boolean }>({
    chave: '',
    dados: null,
    pronto: false,
  });

  useEffect(() => {
    if (!caminho || !sessao) return;
    let cancelado = false;

    api.get<T>(caminho).then((r) => {
      if (cancelado) return;
      setEstado((anterior) => ({
        chave,
        dados: r.ok ? r.dados : anterior.chave === chave ? anterior.dados : null,
        pronto: true,
      }));
    });

    return () => {
      cancelado = true;
    };
  }, [caminho, sessao, chave, versao]);

  const atual = estado.chave === chave ? estado : null;
  return { dados: atual?.dados ?? null, carregando: chave !== '' && !atual?.pronto };
}

/* ------------------- valores "vazios" (antes da resposta) ------------------- */

const HOJE = hojeISO();
const zeros = { concluida: 0, em_andamento: 0, pendente: 0, atrasada: 0 };

const HOME_RH_VAZIO: HomeRH = {
  contagens: { emOnboarding: 0, concluidas: 0, atrasadas: 0, gestores: 0 },
  assinaturasPendentes: [],
  jornadasAtencao: 0,
  eventos: [],
};
const ASSINATURAS_VAZIO: Assinaturas = { assinados: [], pendentes: [] };
const ACOMPANHAMENTO_VAZIO: ItemAcompanhamento[] = [];
const PAINEL_VAZIO: PainelGestores = {
  resumo: { gestores: 0, colaboradores: 0, progressoMedio: 0, atrasados: 0, pendencias: 0, porStatus: zeros },
  gestores: [],
};
const HOME_COLABORADOR_VAZIO: HomeColaborador = {
  hoje: HOJE,
  concluidas: 0,
  total: 0,
  percentual: 0,
  todasConcluidas: false,
  proximas: [],
  feedbacks: [],
};
const ATIVIDADES_VAZIO: Atividades = { hoje: HOJE, total: 0, concluidas: 0, percentual: 0, semanas: [] };
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
const HOME_GESTOR_VAZIO: HomeGestor = { equipe: [], totalEquipe: 0, atencao: [] };
const EQUIPE_VAZIO: Equipe = { hoje: HOJE, itens: [] };
const ATENCAO_VAZIA: Atencao = { pendentes: [], historico: [] };
const GESTORES_VAZIO: { id: string; nome: string }[] = [];

/* ---------------------- hooks usados pelas telas ---------------------- */

// RH
export function useHomeRH() {
  return useConsulta<HomeRH>('/rh/home').dados ?? HOME_RH_VAZIO;
}

export function useAssinaturas() {
  return useConsulta<Assinaturas>('/rh/assinaturas').dados ?? ASSINATURAS_VAZIO;
}

export function useAcompanhamento(filtro?: FiltroJornada) {
  const caminho = filtro ? `/rh/acompanhamento?filtro=${filtro}` : '/rh/acompanhamento';
  return useConsulta<ItemAcompanhamento[]>(caminho).dados ?? ACOMPANHAMENTO_VAZIO;
}

export function usePainelGestores() {
  return useConsulta<PainelGestores>('/rh/painel-gestores').dados ?? PAINEL_VAZIO;
}

export function useGestores() {
  return useConsulta<{ id: string; nome: string }[]>('/gestores').dados ?? GESTORES_VAZIO;
}

// Colaborador
export function useHomeColaborador() {
  return useConsulta<HomeColaborador>('/minha-jornada/home').dados ?? HOME_COLABORADOR_VAZIO;
}

export function useAtividades() {
  return useConsulta<Atividades>('/minha-jornada/atividades').dados ?? ATIVIDADES_VAZIO;
}

// Além dos dados, informa `carregando` (a tela de assinatura espera a resposta antes de decidir se abre)
export function useDocumentos() {
  const { dados, carregando } = useConsulta<DocumentosColaborador>('/minha-jornada/documentos');
  return { ...(dados ?? DOCUMENTOS_VAZIO), carregando };
}

// Gestor
export function useHomeGestor() {
  return useConsulta<HomeGestor>('/minha-equipe/home').dados ?? HOME_GESTOR_VAZIO;
}

export function useEquipe(filtro?: StatusJornada) {
  const caminho = filtro ? `/minha-equipe/equipe?status=${filtro}` : '/minha-equipe/equipe';
  return useConsulta<Equipe>(caminho).dados ?? EQUIPE_VAZIO;
}

export function useAtencao() {
  return useConsulta<Atencao>('/minha-equipe/atencao').dados ?? ATENCAO_VAZIA;
}

// `tela` é null quando o gestor não pode assinar este documento (o servidor responde 404)
export function useAssinaturaGestor(documentoId?: string) {
  const caminho = documentoId ? `/minha-equipe/documentos/${encodeURIComponent(documentoId)}/assinatura` : null;
  const { dados, carregando } = useConsulta<AssinaturaGestorTela>(caminho);
  return { tela: dados, carregando };
}

// Termo de conclusão (PDF) de um colaborador da equipe, depois das duas assinaturas.
// Só busca quando recebe o `documentoId` (o cartão do documento está aberto).
export function useConclusaoGestor(documentoId?: string) {
  const caminho = documentoId ? `/minha-equipe/documentos/${encodeURIComponent(documentoId)}/conclusao` : null;
  return useConsulta<DadosConclusao>(caminho).dados;
}

/* ------------------------------- ações ------------------------------- */

export function useAcoesAtividade() {
  const { executar } = useData();
  return useMemo(
    () => ({
      iniciar: (atividadeId: string) => executar(`/minha-jornada/atividades/${atividadeId}/iniciar`),
      concluir: (atividadeId: string) => executar(`/minha-jornada/atividades/${atividadeId}/concluir`),
    }),
    [executar]
  );
}

export function useAssinarDocumento() {
  const { executar } = useData();
  return useCallback(
    (documentoId: string, nome: string) => executar(`/minha-jornada/documentos/${documentoId}/assinar`, { nome }),
    [executar]
  );
}

export function useAcoesGestor() {
  const { executar } = useData();
  return useMemo(
    () => ({
      enviarFeedback: (colaboradorId: string, texto: string) =>
        executar(`/minha-equipe/colaboradores/${colaboradorId}/feedbacks`, { texto }),
      assinarDocumento: (documentoId: string, nome: string) =>
        executar(`/minha-equipe/documentos/${documentoId}/assinar`, { nome }),
    }),
    [executar]
  );
}

export function useSolicitarAssinatura() {
  const { executar } = useData();
  return useCallback(
    (documentoId: string) => executar(`/rh/documentos/${documentoId}/solicitar-assinatura`),
    [executar]
  );
}

export function useCadastro() {
  const { executar } = useData();
  return useMemo(
    () => ({
      cadastrarColaborador: (dados: NovoColaborador) => executar('/colaboradores', dados),
      cadastrarGestor: (dados: NovoGestor) => executar('/gestores', dados),
    }),
    [executar]
  );
}