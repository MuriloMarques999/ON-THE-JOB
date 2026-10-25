/*
 * MODELO DE DADOS
 * Cada interface abaixo corresponde a uma tabela do banco futuro.
 * - ids são strings (no backend serão gerados pelo servidor)
 * - datas são strings ISO "AAAA-MM-DD"
 * - relações são feitas por id (colaboradorId, gestorId), como chaves estrangeiras
 */

export type Perfil = 'rh' | 'gestor' | 'colaborador';

// Calculado pelo sistema (data de hoje x prazo x ações do colaborador) — o colaborador não edita.
export type StatusAtividade = 'pendente' | 'em_andamento' | 'concluida' | 'atrasada';

// Calculado a partir das atividades e dos documentos — não é guardado.
// pendente = o colaborador ainda não iniciou nenhuma atividade.
export type StatusJornada = 'pendente' | 'em_andamento' | 'atrasada' | 'concluida';

export type TipoDocumento = 'conclusao';

// Filtros da tela de acompanhamento (os mesmos cartões da home do RH)
export type FiltroJornada = 'em_onboarding' | 'concluidas' | 'atrasadas';

// Situação da assinatura de uma das partes (colaborador ou gestor) em um documento
export type StatusAssinatura = 'concluido' | 'pendente';

export interface Pessoa {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  perfil: Perfil;
  cargo: string;
  area?: string;
  gestorId?: string; // só colaborador: gestor responsável
  dataInicio?: string; // só colaborador: início da jornada
}

export interface Atividade {
  id: string;
  colaboradorId: string;
  semana: number;
  titulo: string;
  envolvidos: string; // ex.: "Gestor - Colaborador"
  inicio: string; // a partir de quando pode ser iniciada (admissão + D)
  prazo: string; // data limite
  iniciadaEm?: string; // ação do colaborador: "Iniciar"
  concluidaEm?: string; // ação do colaborador: "Concluir" (definitiva)
}

export interface Documento {
  id: string;
  colaboradorId: string;
  tipo: TipoDocumento;
  titulo: string;
  criadoEm: string; // quando o documento ficou disponível para assinatura
  assinadoColaboradorEm?: string; // o colaborador assina primeiro...
  assinadoGestorEm?: string; // ...depois o gestor
  assinaturaColaborador?: string; // nome digitado como assinatura digital do colaborador
  assinaturaGestor?: string; // nome digitado como assinatura digital do gestor
}

// Documento institucional disponível para download (biblioteca do colaborador)
export interface ItemBiblioteca {
  id: string;
  titulo: string;
  tipo: string; // ex.: "Institucional"
  formato: 'PDF';
  url: string; // no backend: link do arquivo (ex.: S3)
}

export interface Feedback {
  id: string;
  colaboradorId: string;
  gestorId: string;
  texto: string;
  data: string;
}

export interface EventoAutomatico {
  id: string;
  texto: string;
  data: string;
}

// "Banco" completo (em memória enquanto não há backend)
export interface Db {
  pessoas: Pessoa[];
  atividades: Atividade[];
  documentos: Documento[];
  biblioteca: ItemBiblioteca[];
  feedbacks: Feedback[];
  eventos: EventoAutomatico[];
}