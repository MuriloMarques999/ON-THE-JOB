import { criarAtividades, criarDocumentos, hojeISO, somarDias, type AcaoAtividade } from './jornada';
import type { Db, Pessoa } from './types';

/*
 * DADOS DE EXEMPLO (descartável quando o backend existir).
 * As datas são relativas a HOJE, para a demonstração fazer sentido em qualquer dia
 * (ex.: "Anne entrou há 12 dias"). Os e-mails de rh@, gestor@ e colaborador@platform.com
 * são os mesmos dos usuários de teste do login.
 */

// Simula o que o colaborador já fez: as primeiras `concluidas` atividades foram concluídas no
// prazo (as de `comAtraso`, 1 dia depois) e as de `iniciadas` foram só iniciadas.
// O STATUS não é informado: é calculado pelas datas.
function historico(hoje: string, opcoes: { concluidas: number; comAtraso?: number[]; iniciadas?: number[] }) {
  const { concluidas, comAtraso = [], iniciadas = [] } = opcoes;
  const menor = (a: string, b: string) => (a < b ? a : b);

  return (i: number, datas: { inicio: string; prazo: string }): AcaoAtividade => {
    if (i < concluidas) {
      const fim = comAtraso.includes(i) ? somarDias(datas.prazo, 1) : datas.prazo;
      return { iniciadaEm: datas.inicio, concluidaEm: menor(fim, hoje) };
    }
    if (iniciadas.includes(i)) return { iniciadaEm: menor(datas.inicio, hoje) };
    return {};
  };
}

export function criarDbInicial(hoje: string = hojeISO()): Db {
  const dia = (diasAtras: number) => somarDias(hoje, -diasAtras);

  // Admissão de cada colaborador
  const anne = dia(12);
  const matheus = dia(5);
  const beatriz = dia(17);
  const rafael = dia(40);
  const julia = dia(8);
  const marina = dia(40);
  const lucas = dia(0); // entrou hoje: jornada ainda pendente
  const paula = dia(45);
  const diego = dia(40);
  const pedro = dia(40);

  const pessoas: Pessoa[] = [
    { id: 'rh-1', nome: 'Camila Rocha', email: 'rh@platform.com', perfil: 'rh', cargo: 'Analista de RH' },

    { id: 'g-1', nome: 'João Vitor Nogueira', email: 'gestor@platform.com', perfil: 'gestor', cargo: 'Gestor de Tecnologia', area: 'Tecnologia' },
    { id: 'g-2', nome: 'Carlos Meneses', email: 'carlos.meneses@platform.com', perfil: 'gestor', cargo: 'Gestor de Operações', area: 'Operações' },

    // Equipe do João
    { id: 'c-1', nome: 'Anne Carlini', email: 'colaborador@platform.com', perfil: 'colaborador', cargo: 'Product Manager', gestorId: 'g-1', dataInicio: anne },
    { id: 'c-2', nome: 'Matheus Silva Santos', email: 'matheus.santos@platform.com', perfil: 'colaborador', cargo: 'Desenvolvedor', gestorId: 'g-1', dataInicio: matheus },
    { id: 'c-6', nome: 'Marina Alves', email: 'marina.alves@platform.com', perfil: 'colaborador', cargo: 'Analista de Dados', gestorId: 'g-1', dataInicio: marina },
    { id: 'c-7', nome: 'Lucas Ferreira', email: 'lucas.ferreira@platform.com', perfil: 'colaborador', cargo: 'Analista de Suporte', gestorId: 'g-1', dataInicio: lucas },
    { id: 'c-9', nome: 'Diego Martins', email: 'diego.martins@platform.com', perfil: 'colaborador', cargo: 'Analista de Qualidade', gestorId: 'g-1', dataInicio: diego },
    { id: 'c-10', nome: 'Pedro Almeida', email: 'pedro.almeida@platform.com', perfil: 'colaborador', cargo: 'Analista de Processos', gestorId: 'g-1', dataInicio: pedro },
    { id: 'c-8', nome: 'Paula Nunes', email: 'paula.nunes@platform.com', perfil: 'colaborador', cargo: 'Analista Financeiro', gestorId: 'g-1', dataInicio: paula },

    // Equipe do Carlos (o João não enxerga estas pessoas)
    { id: 'c-3', nome: 'Beatriz Lima', email: 'beatriz.lima@platform.com', perfil: 'colaborador', cargo: 'Analista de Operações', gestorId: 'g-2', dataInicio: beatriz },
    { id: 'c-4', nome: 'Rafael Torres', email: 'rafael.torres@platform.com', perfil: 'colaborador', cargo: 'Analista de Logística', gestorId: 'g-2', dataInicio: rafael },
    { id: 'c-5', nome: 'Julia Mendes', email: 'julia.mendes@platform.com', perfil: 'colaborador', cargo: 'Assistente Administrativo', gestorId: 'g-2', dataInicio: julia },
  ];

  return {
    pessoas,

    atividades: [
      // Anne: 6 concluídas (uma com atraso), a 7ª venceu sem ser feita (atrasada), a 8ª em andamento
      ...criarAtividades('c-1', anne, historico(hoje, { concluidas: 6, comAtraso: [3], iniciadas: [7] })),
      // Matheus: em dia
      ...criarAtividades('c-2', matheus, historico(hoje, { concluidas: 2, iniciadas: [2] })),
      // Beatriz: em dia, com uma atividade em andamento
      ...criarAtividades('c-3', beatriz, historico(hoje, { concluidas: 10, iniciadas: [10] })),
      // Rafael: terminou tudo
      ...criarAtividades('c-4', rafael, historico(hoje, { concluidas: 25 })),
      // Marina: concluiu TODAS as atividades e já pode assinar o termo de conclusão
      ...criarAtividades('c-6', marina, historico(hoje, { concluidas: 25 })),
      // Lucas: acabou de entrar (nada iniciado) e Paula: jornada inteira concluída
      ...criarAtividades('c-7', lucas),
      ...criarAtividades('c-8', paula, historico(hoje, { concluidas: 25 })),
      // Diego: concluiu tudo e já assinou o termo; falta a assinatura do gestor
      ...criarAtividades('c-9', diego, historico(hoje, { concluidas: 25 })),
      // Pedro: falta só a última atividade; ao concluí-la, o próximo passo é assinar o termo
      ...criarAtividades('c-10', pedro, historico(hoje, { concluidas: 24, comAtraso: [6, 15] })),
      // Julia: fez só 2 e deixou vencer as seguintes (atrasada)
      ...criarAtividades('c-5', julia, historico(hoje, { concluidas: 2 })),
    ],

    // Só existe o termo de conclusão: o colaborador assina depois de concluir TUDO e o gestor, depois dele
    documentos: [
      ...criarDocumentos('c-1', anne),
      ...criarDocumentos('c-2', matheus),
      ...criarDocumentos('c-3', beatriz),
      ...criarDocumentos('c-4', rafael, [somarDias(rafael, 36), somarDias(rafael, 37)]),
      ...criarDocumentos('c-6', marina), // concluiu tudo e ainda não assinou: assina como colaborador
      ...criarDocumentos('c-7', lucas),
      ...criarDocumentos('c-8', paula, [somarDias(paula, 36), somarDias(paula, 37)]),
      ...criarDocumentos('c-9', diego, [somarDias(diego, 36), undefined]), // falta o gestor assinar
      ...criarDocumentos('c-5', julia),
      ...criarDocumentos('c-10', pedro),
    ],

    // Documentos institucionais para download (no backend: arquivos em um bucket)
    biblioteca: [
      { id: 'b-1', titulo: 'Manual do Colaborador 2026', tipo: 'Institucional', formato: 'PDF', url: '/docs/manual-do-colaborador-2026.pdf' },
      { id: 'b-2', titulo: 'Política de Segurança da informação', tipo: 'Institucional', formato: 'PDF', url: '/docs/politica-de-seguranca.pdf' },
      { id: 'b-3', titulo: 'Guia de ferramentas internas', tipo: 'Institucional', formato: 'PDF', url: '/docs/guia-de-ferramentas.pdf' },
      { id: 'b-4', titulo: 'Código de Conduta', tipo: 'Institucional', formato: 'PDF', url: '/docs/codigo-de-conduta.pdf' },
    ],

    feedbacks: [
      {
        id: 'f-4',
        colaboradorId: 'c-10',
        gestorId: 'g-1',
        texto: 'Mapeou os processos da área com muita autonomia e trouxe boas sugestões de melhoria.',
        data: dia(15),
      },
      {
        id: 'f-5',
        colaboradorId: 'c-10',
        gestorId: 'g-1',
        texto: 'Excelente apresentação de progresso. Seguir com o plano de desenvolvimento combinado.',
        data: dia(6),
      },
      {
        id: 'f-1',
        colaboradorId: 'c-1',
        gestorId: 'g-1',
        texto: 'Boa evolução técnica, está se ambientando no ambiente de trabalho e se aprofundando nas ferramentas internas.',
        data: dia(3),
      },
      {
        id: 'f-3',
        colaboradorId: 'c-6',
        gestorId: 'g-1',
        texto: 'Concluiu a jornada com excelente engajamento e entregas consistentes.',
        data: dia(4),
      },
      {
        id: 'f-2',
        colaboradorId: 'c-3',
        gestorId: 'g-2',
        texto: 'Ótima comunicação com a equipe e muito proativa nas entregas.',
        data: dia(6),
      },
    ],

    eventos: [
      { id: 'e-1', texto: 'Lembrete automático enviado para 4 colaboradores com prazo em 2 dias.', data: dia(2) },
      { id: 'e-2', texto: 'Alerta de atraso de assinatura de documento enviado ao gestor João Nogueira.', data: dia(3) },
    ],
  };
}