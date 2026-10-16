import type { Atividade, Documento, StatusAtividade } from './types';

/*
 * Regra de negócio: ao cadastrar um colaborador, o sistema cria a jornada de onboarding
 * (5 semanas x 4 atividades) e os documentos a assinar. No backend, isso roda no servidor.
 */

export const ATIVIDADES_POR_SEMANA = 4;

const TITULOS = [
  // semana 1
  'Apresentação da empresa',
  'Configuração de acessos',
  'Reunião com o gestor',
  'Treinamento de segurança da informação',
  // semana 2
  'Conhecer a equipe',
  'Leitura do código de conduta',
  'Treinamento de ferramentas internas',
  'Primeira tarefa guiada',
  // semana 3
  'Reunião com o RH',
  'Mapeamento de processos da área',
  'Treinamento técnico',
  'Entrega da segunda tarefa',
  // semana 4
  'Acompanhamento com mentor',
  'Participação em reunião de time',
  'Estudo de caso da área',
  'Apresentação de progresso',
  // semana 5
  'Autoavaliação',
  'Conversa de alinhamento',
  'Plano de desenvolvimento',
  'Encerramento da jornada',
];

export function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function criarAtividades(
  colaboradorId: string,
  inicio: string,
  statusDe: (indice: number) => StatusAtividade = () => 'pendente'
): Atividade[] {
  return TITULOS.map((titulo, i) => {
    const semana = Math.floor(i / ATIVIDADES_POR_SEMANA) + 1;
    return {
      id: `${colaboradorId}-a${i + 1}`,
      colaboradorId,
      semana,
      titulo,
      prazo: somarDias(inicio, semana * 7 - 1),
      status: statusDe(i),
    };
  });
}

type Assinaturas = [colaborador?: string, gestor?: string];

export function criarDocumentos(
  colaboradorId: string,
  estado: { ciencia?: Assinaturas; conclusao?: Assinaturas } = {}
): Documento[] {
  const [cienciaColab, cienciaGestor] = estado.ciencia ?? [];
  const [conclusaoColab, conclusaoGestor] = estado.conclusao ?? [];

  return [
    {
      id: `${colaboradorId}-d1`,
      colaboradorId,
      tipo: 'ciencia',
      titulo: 'Termo de ciência e responsabilidade',
      assinadoColaboradorEm: cienciaColab,
      assinadoGestorEm: cienciaGestor,
    },
    {
      id: `${colaboradorId}-d2`,
      colaboradorId,
      tipo: 'conclusao',
      titulo: 'Termo de conclusão do onboarding',
      assinadoColaboradorEm: conclusaoColab,
      assinadoGestorEm: conclusaoGestor,
    },
  ];
}
