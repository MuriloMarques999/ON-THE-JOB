const { somarDias, DIAS_DA_JORNADA } = require('./jornada');

const ATIVIDADES_POR_SEMANA = 5;

const TEMAS_SEMANA = [
  'Apresentação da empresa',
  'Integração com a equipe',
  'Aprendizado técnico',
  'Prática na área',
  'Avaliação e encerramento',
];

// Documentos institucionais para download (por enquanto, lista fixa)
const BIBLIOTECA = [
  { id: 'b-1', titulo: 'Manual do Colaborador 2026', tipo: 'Institucional', formato: 'PDF', url: '/docs/manual-do-colaborador-2026.pdf' },
  { id: 'b-2', titulo: 'Política de Segurança da informação', tipo: 'Institucional', formato: 'PDF', url: '/docs/politica-de-seguranca.pdf' },
  { id: 'b-3', titulo: 'Guia de ferramentas internas', tipo: 'Institucional', formato: 'PDF', url: '/docs/guia-de-ferramentas.pdf' },
  { id: 'b-4', titulo: 'Código de Conduta', tipo: 'Institucional', formato: 'PDF', url: '/docs/codigo-de-conduta.pdf' },
];

// RN02: a jornada termina 30 dias corridos depois da admissão
const dataFimJornada = (inicio) => somarDias(inicio, DIAS_DA_JORNADA);

// O status NÃO é guardado: é calculado pela data de hoje, pelo prazo e pelas ações do colaborador.
function statusAtividade(a, hoje) {
  if (a.concluidaEm) return 'concluida';
  if (hoje > a.prazo) return 'atrasada';
  if (a.iniciadaEm) return 'em_andamento';
  return 'pendente';
}

const concluidaComAtraso = (a) => !!a.concluidaEm && a.concluidaEm > a.prazo;
const jaPodeIniciar = (a, hoje) => hoje >= a.inicio;

function paraItem(a, hoje) {
  return {
    id: a.id,
    semana: a.semana,
    titulo: a.titulo,
    envolvidos: a.envolvidos,
    inicio: a.inicio,
    prazo: a.prazo,
    status: statusAtividade(a, hoje),
    comAtraso: concluidaComAtraso(a),
    podeIniciar: jaPodeIniciar(a, hoje),
  };
}

function progresso(atividades) {
  const total = atividades.length;
  const concluidas = atividades.filter((a) => !!a.concluidaEm).length;
  return { total, concluidas, percentual: total ? Math.round((concluidas / total) * 100) : 0 };
}

// Atividades concluídas, agrupadas por semana (resumo da tela de documentos)
function resumoSemanas(atividades) {
  const numeros = Array.from(new Set(atividades.map((a) => a.semana))).sort((a, b) => a - b);
  return numeros.map((semana) => ({
    semana,
    tema: TEMAS_SEMANA[semana - 1] ?? '',
    atividades: atividades.filter((a) => a.semana === semana && a.concluidaEm).map((a) => a.titulo),
  }));
}

module.exports = {
  ATIVIDADES_POR_SEMANA,
  BIBLIOTECA,
  dataFimJornada,
  statusAtividade,
  paraItem,
  progresso,
  resumoSemanas,
};