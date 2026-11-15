jest.mock('../../../src/config/db', () => ({
  query: jest.fn(),
}));

const {
  DESTAQUE_ASSINATURAS_HOME,
  passaNoFiltro,
  assinaturas,
  painel,
} = require('../../../src/services/rh');

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
  nome: 'Ana Colaboradora',
  cargo: 'Analista',
  dataInicio: '2026-03-01',
  atividades: [atividade()],
  doc: null,
  feedbacks: [],
  ...sobrescritos,
});

describe('CT-RH regras de acompanhamento do RH', () => {
  it.each([
    ['concluidas', 'concluida', true],
    ['concluidas', 'atrasada', false],
    ['atrasadas', 'atrasada', true],
    ['atrasadas', 'pendente', false],
    ['em_onboarding', 'concluida', false],
    ['em_onboarding', 'em_andamento', true],
    ['filtro inválido', 'concluida', false],
    ['filtro inválido', 'pendente', true],
  ])('CT-RH-001 aplica filtro %s ao status %s', (filtro, status, esperado) => {
    expect(passaNoFiltro(status, filtro)).toBe(esperado);
  });

  it('CT-ASS-002 ordena pendências e assinaturas pela data apropriada', () => {
    const pessoas = [
      colaborador({
        id: 'aguarda-colaborador',
        nome: 'Bia',
        disponivelEm: '2026-03-09',
        atividades: [atividade({ concluidaEm: hoje })],
        doc: { id: 'd1' },
      }),
      colaborador({
        id: 'aguarda-gestor',
        nome: 'Caio',
        atividades: [atividade({ concluidaEm: hoje })],
        doc: { id: 'd2', assinadoColaboradorEm: '2026-03-07' },
      }),
      colaborador({
        id: 'assinado-antigo',
        nome: 'Dora',
        atividades: [atividade({ concluidaEm: hoje })],
        doc: {
          id: 'd3',
          assinadoColaboradorEm: '2026-03-06',
          assinadoGestorEm: '2026-03-08',
        },
      }),
      colaborador({
        id: 'assinado-recente',
        nome: 'Eva',
        atividades: [atividade({ concluidaEm: hoje })],
        doc: {
          id: 'd4',
          assinadoColaboradorEm: '2026-03-08',
          assinadoGestorEm: '2026-03-10',
        },
      }),
      colaborador({ id: 'sem-documento' }),
      colaborador({
        id: 'indisponivel',
        doc: { id: 'd5' },
        atividades: [atividade()],
      }),
    ];

    const resultado = assinaturas(pessoas);

    expect(DESTAQUE_ASSINATURAS_HOME).toBe(2);
    expect(resultado.pendentes.map(({ colaboradorId, data }) => [colaboradorId, data])).toEqual([
      ['aguarda-gestor', '2026-03-07'],
      ['aguarda-colaborador', '2026-03-09'],
    ]);
    expect(resultado.assinados.map(({ colaboradorId, data }) => [colaboradorId, data])).toEqual([
      ['assinado-recente', '2026-03-10'],
      ['assinado-antigo', '2026-03-08'],
    ]);
    expect(resultado.pendentes[0]).toMatchObject({
      colaborador: 'concluido',
      gestor: 'pendente',
    });
  });

  it('CT-RH-002 ordena painel por atrasos, pendências e nome e calcula o resumo', () => {
    const pessoas = [
      colaborador({
        id: 'p1',
        idGestor: 1,
        nome: 'Pessoa A',
        atividades: [atividade({ prazo: '2026-03-09' })],
      }),
      colaborador({
        id: 'p2',
        idGestor: 2,
        nome: 'Pessoa B',
        atividades: [atividade()],
        feedbacks: [],
      }),
      colaborador({
        id: 'p3',
        idGestor: 3,
        nome: 'Pessoa C',
        atividades: [atividade({ concluidaEm: hoje })],
        feedbacks: [{ id: 'fb2', texto: 'Concluído', data: hoje }],
      }),
      colaborador({
        id: 'p4',
        idGestor: 4,
        nome: 'Pessoa D',
        atividades: [atividade()],
        feedbacks: [],
      }),
      colaborador({
        id: 'p5',
        idGestor: 4,
        nome: 'Pessoa E',
        atividades: [atividade({ concluidaEm: hoje })],
        doc: { id: 'doc-p5', assinadoColaboradorEm: hoje },
        feedbacks: [],
      }),
      colaborador({
        id: 'p6',
        idGestor: 6,
        nome: 'Pessoa F',
        atividades: [atividade()],
        feedbacks: [],
      }),
    ];
    const gestores = [
      { id: 'g2', idNum: 2, nome: 'Beto', cargo: 'Gestor' },
      { id: 'g4', idNum: 4, nome: 'Ana', cargo: 'Gestora' },
      { id: 'g1', idNum: 1, nome: 'Caio', cargo: 'Gestor' },
      { id: 'g3', idNum: 3, nome: 'Dora', cargo: 'Gestora' },
      { id: 'g5', idNum: 5, nome: 'Equipe vazia', cargo: 'Gestor' },
      { id: 'g6', idNum: 6, nome: 'Alberto', cargo: 'Gestor' },
    ];

    const resultado = painel(pessoas, gestores, hoje);

    expect(resultado.gestores.map(({ id }) => id)).toEqual([
      'g1',
      'g4',
      'g6',
      'g2',
      'g3',
      'g5',
    ]);
    expect(resultado.resumo).toEqual({
      gestores: 6,
      colaboradores: 6,
      progressoMedio: 33,
      atrasados: 1,
      pendencias: 6,
      porStatus: { concluida: 2, em_andamento: 0, pendente: 3, atrasada: 1 },
    });
    expect(resultado.gestores.find(({ id }) => id === 'g5')).toMatchObject({
      total: 0,
      progressoMedio: 0,
      porStatus: { concluida: 0, em_andamento: 0, pendente: 0, atrasada: 0 },
    });
  });
});
