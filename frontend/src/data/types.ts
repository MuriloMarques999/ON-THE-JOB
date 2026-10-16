/*
 * MODELO DE DADOS
 * Cada interface abaixo corresponde a uma tabela do banco futuro.
 * - ids são strings (no backend serão gerados pelo servidor)
 * - datas são strings ISO "AAAA-MM-DD"
 * - relações são feitas por id (colaboradorId, gestorId), como chaves estrangeiras
 */

export type Perfil = 'rh' | 'gestor' | 'colaborador';

export type StatusAtividade = 'pendente' | 'em_andamento' | 'concluida' | 'atrasada';

// Calculado a partir das atividades e dos documentos — não é guardado.
export type StatusJornada = 'em_andamento' | 'atrasada' | 'concluida';

export type TipoDocumento = 'ciencia' | 'conclusao';

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
  prazo: string;
  status: StatusAtividade;
}

export interface Documento {
  id: string;
  colaboradorId: string;
  tipo: TipoDocumento;
  titulo: string;
  assinadoColaboradorEm?: string; // o colaborador assina primeiro...
  assinadoGestorEm?: string; // ...depois o gestor
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
  feedbacks: Feedback[];
  eventos: EventoAutomatico[];
}
