import { hojeISO } from '@/data/jornada';
import type { ItemAtividade } from '@/data/queries';

import { dataHora, type Bloco, type DocumentoPdf } from './modelo';

/*
 * Termo de conclusão do onboarding ("Formulário On The Job"): só existe depois que colaborador e
 * gestor assinaram. Registra todas as atividades realizadas, os feedbacks e a validação final.
 */

export type DadosConclusao = {
  colaborador: { nome: string; cargo: string; email: string };
  inicio?: string;
  fim?: string;
  semanas: { semana: number; tema: string; atividades: ItemAtividade[] }[];
  feedbacks: { texto: string; data: string; autor: string }[];
  assinaturaColaborador: { nome: string; data: string };
  assinaturaGestor: { nome: string; data: string };
};

const TITULO = 'Termo de Conclusão do Onboarding';

export function documentoConclusao(d: DadosConclusao): DocumentoPdf {
  const atividades = d.semanas.flatMap((s) => s.atividades);
  const concluidas = atividades.filter((a) => a.concluidaEm);
  const comAtraso = concluidas.filter((a) => a.comAtraso).length;
  const ultimaConclusao = concluidas.map((a) => a.concluidaEm!).sort().at(-1);
  const percentual = atividades.length ? Math.round((concluidas.length / atividades.length) * 100) : 0;

  let numero = 0;
  const porSemana: Bloco[] = d.semanas.flatMap((s) => [
    // reserva espaço para o título, o cabeçalho e as primeiras linhas da tabela ficarem juntos
    { tipo: 'subsecao' as const, texto: `Semana ${s.semana}${s.tema ? ` - ${s.tema}` : ''}`, reservar: 32 },
    {
      tipo: 'tabela' as const,
      colunas: [
        { titulo: 'Nº', largura: 0.06 },
        { titulo: 'Atividade', largura: 0.29 },
        { titulo: 'Envolvidos', largura: 0.17 },
        { titulo: 'Prazo', largura: 0.1 },
        { titulo: 'Iniciada em', largura: 0.11 },
        { titulo: 'Concluída em', largura: 0.14 },
        { titulo: 'Situação', largura: 0.13 },
      ],
      linhas: s.atividades.map((a) => [
        String(++numero).padStart(2, '0'),
        a.titulo,
        a.envolvidos,
        dataHora(a.prazo),
        dataHora(a.iniciadaEm),
        dataHora(a.concluidaEm),
        !a.concluidaEm ? 'Não concluída' : a.comAtraso ? 'Com atraso' : 'No prazo',
      ]),
    },
  ]);

  return {
    titulo: `${TITULO} - ${d.colaborador.nome}`,
    arquivo: `termo-de-conclusao-${d.colaborador.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`,
    blocos: [
      { tipo: 'marca', texto: 'On the job' },
      { tipo: 'titulo', texto: TITULO },
      { tipo: 'subtitulo', texto: `Formulário On The Job • emitido em ${dataHora(hojeISO())}` },

      { tipo: 'secao', texto: '1. Identificação' },
      {
        tipo: 'campos',
        itens: [
          ['Colaborador', d.colaborador.nome],
          ['Cargo', d.colaborador.cargo || '-'],
          ['E-mail', d.colaborador.email],
          ['Gestor responsável', d.assinaturaGestor.nome],
          ['Período da jornada', `${dataHora(d.inicio)} a ${dataHora(d.fim)}`],
        ],
      },

      { tipo: 'secao', texto: '2. Resumo da jornada' },
      {
        tipo: 'campos',
        itens: [
          ['Atividades concluídas', `${concluidas.length} de ${atividades.length} (${percentual}%)`],
          ['Concluídas no prazo', String(concluidas.length - comAtraso)],
          ['Concluídas com atraso', String(comAtraso)],
          ['Feedbacks recebidos', String(d.feedbacks.length)],
          ['Última atividade concluída em', dataHora(ultimaConclusao)],
        ],
      },

      { tipo: 'secao', texto: '3. Atividades realizadas' },
      ...porSemana,

      { tipo: 'secao', texto: '4. Feedbacks do gestor' },
      ...(d.feedbacks.length === 0
        ? [{ tipo: 'texto' as const, texto: 'Nenhum feedback registrado durante a jornada.' }]
        : d.feedbacks.map((f) => ({ tipo: 'texto' as const, texto: `${dataHora(f.data)} - ${f.autor}: "${f.texto}"` }))),

      // título, declaração e assinaturas ficam sempre na mesma página
      { tipo: 'secao', texto: '5. Validação final e aceite', reservar: 85 },
      {
        tipo: 'texto',
        texto:
          'O colaborador declara que realizou as atividades descritas neste documento durante a jornada de onboarding. O gestor responsável valida a realização das atividades e a conclusão do programa On The Job. As partes assinam digitalmente este termo, na ordem: colaborador e, em seguida, gestor.',
      },
      {
        tipo: 'assinaturas',
        itens: [
          { papel: 'Colaborador', nome: d.assinaturaColaborador.nome, data: dataHora(d.assinaturaColaborador.data) },
          { papel: 'Gestor responsável', nome: d.assinaturaGestor.nome, data: dataHora(d.assinaturaGestor.data) },
        ],
      },
      {
        tipo: 'texto',
        pequeno: true,
        texto:
          'Situação do processo: CONCLUÍDO - assinado pelo colaborador e pelo gestor. Documento gerado pela plataforma On the job; as assinaturas digitais correspondem ao nome completo digitado por cada parte, registrado com a data da assinatura.',
      },
    ],
  };
}
