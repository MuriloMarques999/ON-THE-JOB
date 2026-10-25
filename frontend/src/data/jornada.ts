import type { Atividade, Documento, StatusAtividade } from './types';

/*
 * Regras de negócio da jornada. No backend, isto roda no servidor.
 * - 5 semanas x 5 atividades = 25
 * - cada atividade tem janela própria relativa à admissão (D+1 a D+3, D+2 a D+4...)
 * - o status é CALCULADO (statusAtividade); o colaborador só inicia/conclui
 */

export const ATIVIDADES_POR_SEMANA = 5;
export const DURACAO_JORNADA_DIAS = 35; // 5 semanas
const DIAS_DE_PRAZO = 2; // prazo = início + 2 (ex.: D+1 a D+3)

const MODELO: { titulo: string; envolvidos: string }[] = [
  // semana 1
  { titulo: 'Apresentação da empresa', envolvidos: 'RH - Colaborador' },
  { titulo: 'Configuração de acessos', envolvidos: 'RH - Colaborador' },
  { titulo: 'Reunião com o gestor', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Apresentação da equipe', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Treinamento de segurança da informação', envolvidos: 'RH - Colaborador' },
  // semana 2
  { titulo: 'Leitura do código de conduta', envolvidos: 'RH - Colaborador' },
  { titulo: 'Treinamento de ferramentas internas', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Conhecer os processos da área', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Primeira tarefa guiada', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Conversa com um colega de equipe', envolvidos: 'Colaborador' },
  // semana 3
  { titulo: 'Reunião com o RH', envolvidos: 'RH - Colaborador' },
  { titulo: 'Mapeamento de processos da área', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Treinamento técnico', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Entrega da segunda tarefa', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Visita às áreas parceiras', envolvidos: 'Colaborador' },
  // semana 4
  { titulo: 'Acompanhamento com mentor', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Participação em reunião de time', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Estudo de caso da área', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Apresentação de progresso', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Feedback intermediário', envolvidos: 'Gestor - Colaborador' },
  // semana 5
  { titulo: 'Autoavaliação', envolvidos: 'Colaborador' },
  { titulo: 'Conversa de alinhamento', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Plano de desenvolvimento', envolvidos: 'Gestor - Colaborador' },
  { titulo: 'Avaliação da jornada', envolvidos: 'RH - Colaborador' },
  { titulo: 'Encerramento da jornada', envolvidos: 'RH - Colaborador' },
];

export function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Fim da jornada = prazo da última atividade (D+35)
export function dataFimJornada(inicio: string) {
  return somarDias(inicio, DURACAO_JORNADA_DIAS);
}

// Data de hoje no fuso do aparelho (AAAA-MM-DD)
export function hojeISO() {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export interface AcaoAtividade {
  iniciadaEm?: string;
  concluidaEm?: string;
}

// `acao` só é usada pelos dados de exemplo para simular o que o colaborador já fez.
export function criarAtividades(
  colaboradorId: string,
  admissao: string,
  acao: (indice: number, datas: { inicio: string; prazo: string }) => AcaoAtividade = () => ({})
): Atividade[] {
  return MODELO.map((m, i) => {
    const semana = Math.floor(i / ATIVIDADES_POR_SEMANA) + 1;
    const posicao = i % ATIVIDADES_POR_SEMANA;
    const diaInicio = 7 * (semana - 1) + 1 + posicao; // D+1, D+2, ... dentro da semana
    const inicio = somarDias(admissao, diaInicio);
    const prazo = somarDias(admissao, diaInicio + DIAS_DE_PRAZO);

    return {
      id: `${colaboradorId}-a${i + 1}`,
      colaboradorId,
      semana,
      titulo: m.titulo,
      envolvidos: m.envolvidos,
      inicio,
      prazo,
      ...acao(i, { inicio, prazo }),
    };
  });
}

/* ------------------------ status (calculado) ------------------------ */

export function statusAtividade(a: Atividade, hoje: string): StatusAtividade {
  if (a.concluidaEm) return 'concluida';
  if (hoje > a.prazo) return 'atrasada'; // prazo venceu e não concluiu
  if (a.iniciadaEm) return 'em_andamento'; // iniciada dentro do prazo
  return 'pendente'; // ainda não iniciada
}

export const concluidaComAtraso = (a: Atividade) => !!a.concluidaEm && a.concluidaEm > a.prazo;

// O colaborador só pode iniciar a partir da data de início da atividade.
export const jaPodeIniciar = (a: Atividade, hoje: string) => hoje >= a.inicio;

/* ----------------------------- documentos ----------------------------- */

type Assinaturas = [colaborador?: string, gestor?: string];

// Cada colaborador tem UM documento para assinar: o termo de conclusão. Ele só fica disponível
// quando TODAS as atividades foram concluídas; o colaborador assina primeiro e só então o gestor é chamado.
export function criarDocumentos(colaboradorId: string, inicio: string, conclusao: Assinaturas = []): Documento[] {
  const [colaborador, gestor] = conclusao;

  return [
    {
      id: `${colaboradorId}-d1`,
      colaboradorId,
      tipo: 'conclusao',
      titulo: 'Termo de conclusão do onboarding',
      criadoEm: dataFimJornada(inicio),
      assinadoColaboradorEm: colaborador,
      assinadoGestorEm: gestor,
    },
  ];
}