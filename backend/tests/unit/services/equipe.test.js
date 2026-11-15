jest.mock('../../../src/config/db', () => ({
  query: jest.fn(),
}));

const {
  DESTAQUE_EQUIPE_HOME,
  TITULO_DOCUMENTO,
  statusJornada,
  pendenciaAssinatura,
  montarEquipe,
  montarAtencao,
} = require('../../../src/services/equipe');

const hoje = '2026-03-10';
const atividade = (sobrescritos = {}) => ({
  id: '1',
  semana: 1,
  titulo: 'Atividade',
  envolvidos: 'Colaborador',
  inicio: '2026-03-01',
  prazo: '2026-03-20',
  iniciadaEm: undefined,
  concluidaEm: undefined,
  ...sobrescritos,
});

const colaborador = (sobrescritos = {}) => ({
  id: '1',
  idGestor: 1,
  nome: 'Anne Colaboradora',
  cargo: 'Analista',
  dataInicio: '2026-03-01',
  atividades: [atividade()],
  doc: null,
  feedbacks: [],
  ...sobrescritos,
});

const atividadesAtrasadas = (quantidade) =>
  Array.from({ length: quantidade }, (_, indice) =>
    atividade({ id: String(indice + 1), prazo: '2026-03-09' })
  );

describe('[CRITICO] CT-EQP regras de equipe e assinatura', () => {
  it.each([
    ['lista vazia', [], 'pendente'],
    ['sem atividades iniciadas', [atividade()], 'pendente'],
    ['alguma atividade atrasada', atividadesAtrasadas(1), 'atrasada'],
    [
      'atraso prevalece sobre atividade iniciada',
      [atividade({ prazo: '2026-03-09' }), atividade({ iniciadaEm: hoje })],
      'atrasada',
    ],
    ['atividade iniciada sem atraso', [atividade({ iniciadaEm: hoje })], 'em_andamento'],
    ['todas as atividades concluídas', [atividade({ concluidaEm: hoje })], 'concluida'],
    [
      'concluídas prevalecem sobre tarefas atrasadas',
      [atividade({ prazo: '2026-03-09', concluidaEm: hoje })],
      'concluida',
    ],
  ])('CT-EQP-001 determina status da jornada: %s', (_caso, atividades, esperado) => {
    expect(statusJornada(colaborador({ atividades }), hoje)).toBe(esperado);
  });

  it.each([
    [
      'sem documento',
      colaborador({ atividades: [atividade({ concluidaEm: hoje })] }),
      null,
    ],
    ['sem atividades', colaborador({ atividades: [], doc: {} }), null],
    ['nem todas concluídas', colaborador({ atividades: [atividade()], doc: {} }), null],
    [
      'aguarda assinatura do colaborador',
      colaborador({
        atividades: [atividade({ concluidaEm: hoje })],
        doc: {},
      }),
      'colaborador',
    ],
    [
      'aguarda assinatura do gestor',
      colaborador({
        atividades: [atividade({ concluidaEm: hoje })],
        doc: { assinadoColaboradorEm: hoje },
      }),
      'gestor',
    ],
    [
      'ambas as assinaturas concluídas',
      colaborador({
        atividades: [atividade({ concluidaEm: hoje })],
        doc: { assinadoColaboradorEm: hoje, assinadoGestorEm: hoje },
      }),
      null,
    ],
  ])('CT-ASS-001 identifica pendência de assinatura: %s', (_caso, item, esperado) => {
    expect(pendenciaAssinatura(item)).toBe(esperado);
  });

  it('CT-EQP-002 ordena por status, quantidade de atrasos e menor progresso', () => {
    const pessoas = [
      colaborador({ id: 'concluida', atividades: [atividade({ concluidaEm: hoje })] }),
      colaborador({ id: 'andamento', atividades: [atividade({ iniciadaEm: hoje })] }),
      colaborador({ id: 'pendente', atividades: [atividade()] }),
      colaborador({ id: 'uma-atrasada', atividades: atividadesAtrasadas(1) }),
      colaborador({ id: 'duas-atrasadas', atividades: atividadesAtrasadas(2) }),
      colaborador({
        id: 'menor-progresso',
        atividades: [
          atividade({ id: '1', iniciadaEm: hoje }),
          atividade({ id: '2' }),
          atividade({ id: '3' }),
        ],
      }),
      colaborador({
        id: 'maior-progresso',
        atividades: [
          atividade({ id: '1', iniciadaEm: hoje }),
          atividade({ id: '2', concluidaEm: hoje }),
          atividade({ id: '3' }),
        ],
      }),
    ];

    expect(montarEquipe(pessoas, hoje).map(({ id }) => id)).toEqual([
      'duas-atrasadas',
      'uma-atrasada',
      'pendente',
      'andamento',
      'menor-progresso',
      'maior-progresso',
      'concluida',
    ]);
  });

  it('CT-EQP-003 apresenta motivos, atrasos e até cinco pendências por prazo', () => {
    const itens = Array.from({ length: 7 }, (_, indice) =>
      atividade({
        id: String(indice + 1),
        titulo: `Atividade ${indice + 1}`,
        prazo: `2026-03-${String(11 + (6 - indice)).padStart(2, '0')}`,
      })
    );
    const [item] = montarEquipe([colaborador({ atividades: itens })], hoje);
    const [pendente] = montarEquipe([colaborador({ id: 'p', atividades: [atividade()] })], hoje);
    const atrasado = montarEquipe(
      [colaborador({ id: 'a', atividades: atividadesAtrasadas(1) })],
      hoje
    )[0];
    const variosAtrasos = montarEquipe(
      [colaborador({ id: 'b', atividades: atividadesAtrasadas(2) })],
      hoje
    )[0];

    expect(item.atividadesPendentes).toHaveLength(5);
    expect(item.atividadesPendentes.map(({ prazo }) => prazo)).toEqual([
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
      '2026-03-15',
    ]);
    expect(item.totalPendentes).toBe(7);
    expect(pendente.motivo).toBe('Jornada ainda não iniciada');
    expect(atrasado.motivo).toBe('1 atividade atrasada');
    expect(variosAtrasos.motivo).toBe('2 atividades atrasadas');
  });

  it('CT-EQP-004 monta pendências e histórico em ordem cronológica', () => {
    const pessoas = [
      colaborador({
        id: '1',
        nome: 'Bia Colaboradora',
        dataInicio: '2026-03-04',
        atividades: [atividade({ concluidaEm: hoje })],
        doc: { id: 'doc-1' },
        feedbacks: [],
      }),
      colaborador({
        id: '2',
        nome: 'Ana Colaboradora',
        dataInicio: '2026-03-02',
        atividades: [atividade({ concluidaEm: hoje })],
        doc: { id: 'doc-2', assinadoColaboradorEm: '2026-03-08' },
        feedbacks: [{ id: 'fb-1', texto: 'Bom trabalho', data: '2026-03-09' }],
      }),
      colaborador({
        id: '3',
        nome: 'Cris Colaboradora',
        dataInicio: '2026-03-01',
        atividades: [atividade()],
        doc: null,
        feedbacks: [],
      }),
      colaborador({
        id: '4',
        nome: 'Dani Colaboradora',
        dataInicio: '2026-03-05',
        atividades: [atividade()],
        doc: null,
        feedbacks: [{ id: 'fb-2', texto: 'Acompanhamento', data: '2026-03-10' }],
      }),
    ];

    const resultado = montarAtencao(pessoas, 'João Gestor', hoje);

    expect(DESTAQUE_EQUIPE_HOME).toBe(3);
    expect(TITULO_DOCUMENTO).toBe('Termo de conclusão do onboarding');
    expect(resultado.pendentes.map(({ id }) => id)).toEqual(['3-fb', '1-fb', 'doc-2-ass']);
    expect(resultado.pendentes[2]).toMatchObject({
      tipo: 'assinatura',
      documentoTitulo: TITULO_DOCUMENTO,
      quando: '2026-03-08',
    });
    expect(resultado.historico.map(({ id }) => id)).toEqual(['fb-fb-2', 'fb-fb-1']);
    expect(resultado.historico.map(({ quando }) => quando)).toEqual([
      '2026-03-10',
      '2026-03-09',
    ]);
  });
});
