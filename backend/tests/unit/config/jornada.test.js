const {
  criarAtividades,
  hojeISO,
  somarDias,
  DIAS_DA_JORNADA,
} = require('../../../src/config/jornada');

describe('[CRITICO] CT-JOR regras de datas da jornada', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('CT-JOR-001 cria 25 atividades com datas e títulos do modelo', () => {
    const atividades = criarAtividades('2026-01-01');
    const esperadas = [
      ['Apresentação da empresa', 'RH - Colaborador', 1, 3],
      ['Configuração de acessos', 'RH - Colaborador', 2, 4],
      ['Reunião com o gestor', 'Gestor - Colaborador', 3, 5],
      ['Apresentação da equipe', 'Gestor - Colaborador', 4, 6],
      ['Treinamento de segurança da informação', 'RH - Colaborador', 5, 7],
      ['Leitura do código de conduta', 'RH - Colaborador', 7, 9],
      ['Treinamento de ferramentas internas', 'Gestor - Colaborador', 8, 10],
      ['Conhecer os processos da área', 'Gestor - Colaborador', 9, 11],
      ['Primeira tarefa guiada', 'Gestor - Colaborador', 10, 12],
      ['Conversa com um colega de equipe', 'Colaborador', 11, 13],
      ['Reunião com o RH', 'RH - Colaborador', 13, 15],
      ['Mapeamento de processos da área', 'Gestor - Colaborador', 14, 16],
      ['Treinamento técnico', 'Gestor - Colaborador', 15, 17],
      ['Entrega da segunda tarefa', 'Gestor - Colaborador', 16, 18],
      ['Visita às áreas parceiras', 'Colaborador', 17, 19],
      ['Acompanhamento com mentor', 'Gestor - Colaborador', 19, 21],
      ['Participação em reunião de time', 'Gestor - Colaborador', 20, 22],
      ['Estudo de caso da área', 'Gestor - Colaborador', 21, 23],
      ['Apresentação de progresso', 'Gestor - Colaborador', 22, 24],
      ['Feedback intermediário', 'Gestor - Colaborador', 23, 25],
      ['Autoavaliação', 'Colaborador', 25, 27],
      ['Conversa de alinhamento', 'Gestor - Colaborador', 26, 28],
      ['Plano de desenvolvimento', 'Gestor - Colaborador', 27, 29],
      ['Avaliação da jornada', 'RH - Colaborador', 28, 30],
      ['Encerramento da jornada', 'RH - Colaborador', 29, 30],
    ];

    expect(atividades).toHaveLength(25);
    expect(atividades.every((atividade) => atividade.prazo <= '2026-01-31')).toBe(true);
    expect(atividades).toEqual(
      esperadas.map(([titulo, envolvidos, inicio, prazo]) => ({
        titulo,
        envolvidos,
        inicio: somarDias('2026-01-01', inicio),
        prazo: somarDias('2026-01-01', prazo),
      }))
    );

    for (let semana = 1; semana <= 5; semana += 1) {
      const primeiraAtividade = atividades[(semana - 1) * 5];
      expect(primeiraAtividade.inicio).toBe(
        somarDias('2026-01-01', 6 * (semana - 1) + 1)
      );
    }
  });

  it('CT-JOR-002 mantém a jornada limitada a 30 dias', () => {
    expect(DIAS_DA_JORNADA).toBe(30);
    expect(criarAtividades('2026-01-01')[24].prazo).toBe('2026-01-31');
  });

  it.each([
    ['virada de ano', '2026-12-31', 1, '2027-01-01'],
    ['ano bissexto', '2028-02-28', 1, '2028-02-29'],
    ['dia seguinte ao bissexto', '2028-02-29', 1, '2028-03-01'],
    ['virada de mês negativa', '2026-03-01', -1, '2026-02-28'],
    ['dias negativos', '2026-03-10', -10, '2026-02-28'],
  ])('CT-JOR-003 soma dias corretamente na %s', (_caso, data, dias, resultado) => {
    expect(somarDias(data, dias)).toBe(resultado);
  });

  it('CT-JOR-005 soma datas independentemente do fuso configurado', () => {
    const fusoOriginal = process.env.TZ;
    try {
      for (const fuso of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
        process.env.TZ = fuso;
        expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
        expect(somarDias('2028-02-28', 1)).toBe('2028-02-29');
      }
    } finally {
      if (fusoOriginal === undefined) delete process.env.TZ;
      else process.env.TZ = fusoOriginal;
    }
  });

  it.each([
    [new Date(2026, 0, 2, 23, 59), '2026-01-02'],
    [new Date(2026, 2, 10, 0, 1), '2026-03-10'],
  ])('CT-JOR-004 hojeISO retorna data local com zeros à esquerda', (agora, esperado) => {
    jest.useFakeTimers({
      now: agora,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });

    expect(hojeISO()).toBe(esperado);
  });
});
