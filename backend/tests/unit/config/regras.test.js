const {
  ATIVIDADES_POR_SEMANA,
  BIBLIOTECA,
  dataFimJornada,
  statusAtividade,
  paraItem,
  progresso,
  resumoSemanas,
} = require('../../../src/config/regras');

const hoje = '2026-03-10';
const atividade = (sobrescritos = {}) => ({
  id: '1',
  semana: 1,
  titulo: 'Atividade de teste',
  envolvidos: 'Colaborador',
  inicio: hoje,
  prazo: hoje,
  iniciadaEm: undefined,
  concluidaEm: undefined,
  ...sobrescritos,
});

describe('[CRITICO] CT-STA regras de status e progresso', () => {
  it.each([
    ['pendente', atividade(), 'pendente'],
    ['iniciada no prazo', atividade({ iniciadaEm: hoje }), 'em_andamento'],
    ['prazo é hoje', atividade({ prazo: hoje }), 'pendente'],
    ['iniciada e prazo é hoje', atividade({ prazo: hoje, iniciadaEm: hoje }), 'em_andamento'],
    ['atrasada no dia seguinte ao prazo', atividade({ prazo: '2026-03-09' }), 'atrasada'],
    ['concluída no prazo', atividade({ concluidaEm: hoje }), 'concluida'],
    [
      'concluída depois do prazo',
      atividade({ prazo: '2026-03-09', concluidaEm: hoje }),
      'concluida',
    ],
  ])('CT-STA-001 calcula status: %s', (_caso, item, esperado) => {
    expect(statusAtividade(item, hoje)).toBe(esperado);
  });

  it('CT-STA-002 identifica atraso e início na borda da data', () => {
    expect(paraItem(atividade({ prazo: '2026-03-09', concluidaEm: hoje }), hoje)).toEqual({
      ...atividade({ prazo: '2026-03-09', concluidaEm: hoje }),
      status: 'concluida',
      comAtraso: true,
      podeIniciar: true,
    });
    expect(paraItem(atividade({ inicio: '2026-03-11' }), hoje).podeIniciar).toBe(false);
    expect(paraItem(atividade({ inicio: hoje }), hoje).podeIniciar).toBe(true);
    expect(paraItem(atividade({ concluidaEm: hoje }), hoje).comAtraso).toBe(false);
  });

  it.each([
    [[], { total: 0, concluidas: 0, percentual: 0 }],
    [[atividade()], { total: 1, concluidas: 0, percentual: 0 }],
    [
      [atividade({ concluidaEm: hoje }), atividade(), atividade()],
      { total: 3, concluidas: 1, percentual: 33 },
    ],
    [
      [atividade({ concluidaEm: hoje }), atividade({ concluidaEm: hoje }), atividade()],
      { total: 3, concluidas: 2, percentual: 67 },
    ],
  ])('CT-STA-003 calcula o progresso de %i atividades', (itens, esperado) => {
    expect(progresso(itens)).toEqual(esperado);
  });

  it('CT-STA-004 resume somente atividades concluídas e ordena semanas', () => {
    const itens = [
      atividade({ semana: 3, titulo: 'Terceira', concluidaEm: hoje }),
      atividade({ semana: 1, titulo: 'Pendente', concluidaEm: undefined }),
      atividade({ semana: 1, titulo: 'Primeira', concluidaEm: hoje }),
      atividade({ semana: 6, titulo: 'Semana sem tema', concluidaEm: hoje }),
    ];

    expect(resumoSemanas(itens)).toEqual([
      { semana: 1, tema: 'Apresentação da empresa', atividades: ['Primeira'] },
      { semana: 3, tema: 'Aprendizado técnico', atividades: ['Terceira'] },
      { semana: 6, tema: '', atividades: ['Semana sem tema'] },
    ]);
  });

  it('CT-JOR-006 calcula o fim da jornada e as atividades semanais', () => {
    expect(ATIVIDADES_POR_SEMANA).toBe(5);
    expect(dataFimJornada('2026-01-01')).toBe('2026-01-31');
  });

  it('CT-API-003 disponibiliza os quatro documentos institucionais', () => {
    expect(BIBLIOTECA).toHaveLength(4);
    expect(BIBLIOTECA.map(({ id }) => id)).toEqual(['b-1', 'b-2', 'b-3', 'b-4']);
    expect(BIBLIOTECA.every((documento) => documento.formato === 'PDF')).toBe(true);
  });
});
