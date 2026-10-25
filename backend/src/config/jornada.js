const ATIVIDADES_POR_SEMANA = 5;
const DIAS_DA_JORNADA = 30; // RN02: o On The Job dura 30 dias corridos a partir da admissão
const DIAS_ENTRE_SEMANAS = 6; // cada semana começa 6 dias depois da anterior (5 semanas cabem em 30 dias)
const DIAS_DE_PRAZO = 2; // prazo = início + 2 (ex.: D+1 a D+3), limitado ao último dia da jornada

const MODELO = [
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

function somarDias(iso, dias) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Data de hoje no fuso do servidor (AAAA-MM-DD)
function hojeISO() {
  const d = new Date();
  const dois = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

// Gera as 25 atividades de um colaborador, com início e prazo próprios a partir da admissão.
// Nenhum prazo passa do último dia da jornada (admissão + 30 dias).
function criarAtividades(admissao) {
  return MODELO.map((m, i) => {
    const semana = Math.floor(i / ATIVIDADES_POR_SEMANA) + 1;
    const posicao = i % ATIVIDADES_POR_SEMANA;
    const diaInicio = DIAS_ENTRE_SEMANAS * (semana - 1) + 1 + posicao; // D+1, D+2, ... dentro da semana
    const diaPrazo = Math.min(diaInicio + DIAS_DE_PRAZO, DIAS_DA_JORNADA);
    return {
      titulo: m.titulo,
      envolvidos: m.envolvidos,
      inicio: somarDias(admissao, diaInicio),
      prazo: somarDias(admissao, diaPrazo),
    };
  });
}

module.exports = { criarAtividades, hojeISO, somarDias, DIAS_DA_JORNADA };