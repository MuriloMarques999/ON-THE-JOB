import {
  criarAtividades,
  criarDocumentos,
  dataFimJornada,
  DURACAO_JORNADA_DIAS,
  statusAtividade,
  concluidaComAtraso,
  jaPodeIniciar,
  type AcaoAtividade,
} from '../../src/data/jornada';
import type { Atividade } from '../../src/data/types';

const exemplo: Atividade = {
  id: 'c-1-a1',
  colaboradorId: 'c-1',
  semana: 1,
  titulo: 'Atividade',
  envolvidos: 'Colaborador',
  inicio: '2026-03-10',
  prazo: '2026-03-10',
};

describe('regras de jornada do frontend', () => {
  it('CT-JOR-101 cria as 25 atividades segundo a fórmula legada de semanas de sete dias', () => {
    const atividades = criarAtividades('c-1', '2026-01-01');

    expect(atividades).toHaveLength(25);
    expect(atividades[0]).toMatchObject({
      id: 'c-1-a1',
      colaboradorId: 'c-1',
      semana: 1,
      titulo: 'Apresentação da empresa',
      envolvidos: 'RH - Colaborador',
      inicio: '2026-01-02',
      prazo: '2026-01-04',
    });
    expect(atividades[5]).toMatchObject({
      semana: 2,
      inicio: '2026-01-09',
      prazo: '2026-01-11',
    });
    expect(atividades[9].envolvidos).toBe('Colaborador');
    expect(atividades[14].envolvidos).toBe('Colaborador');
    expect(atividades[20].envolvidos).toBe('Colaborador');
    expect(atividades[24]).toMatchObject({
      titulo: 'Encerramento da jornada',
      envolvidos: 'RH - Colaborador',
      inicio: '2026-02-03',
      prazo: '2026-02-05',
    });
    expect(DURACAO_JORNADA_DIAS).toBe(35);
    expect(dataFimJornada('2026-01-01')).toBe('2026-02-05');
  });

  it('CT-JOR-102 permite simular ações por índice e entrega as datas da atividade', () => {
    const acao: AcaoAtividade = { iniciadaEm: '2026-01-02' };
    const callback = jest.fn((indice: number) => (indice === 0 ? acao : {}));
    const [primeira, segunda] = criarAtividades('c-1', '2026-01-01', callback);

    expect(callback).toHaveBeenCalledWith(0, {
      inicio: '2026-01-02',
      prazo: '2026-01-04',
    });
    expect(primeira.iniciadaEm).toBe('2026-01-02');
    expect(segunda.iniciadaEm).toBeUndefined();
  });

  it.each([
    ['pendente', exemplo, '2026-03-10', 'pendente'],
    ['iniciada', { ...exemplo, iniciadaEm: '2026-03-10' }, '2026-03-10', 'em_andamento'],
    ['limite do prazo', exemplo, '2026-03-10', 'pendente'],
    ['atrasada após o prazo', exemplo, '2026-03-11', 'atrasada'],
    ['concluída', { ...exemplo, concluidaEm: '2026-03-11' }, '2026-03-12', 'concluida'],
    [
      'concluída com atraso',
      { ...exemplo, concluidaEm: '2026-03-11' },
      '2026-03-12',
      'concluida',
    ],
  ])('CT-STA-101 calcula o status %s', (_caso, atividade, hoje, esperado) => {
    expect(statusAtividade(atividade, hoje)).toBe(esperado);
  });

  it('CT-STA-102 calcula atraso de conclusão e disponibilidade para iniciar', () => {
    expect(concluidaComAtraso({ ...exemplo, concluidaEm: '2026-03-11' })).toBe(true);
    expect(concluidaComAtraso({ ...exemplo, concluidaEm: '2026-03-10' })).toBe(false);
    expect(jaPodeIniciar(exemplo, '2026-03-09')).toBe(false);
    expect(jaPodeIniciar(exemplo, '2026-03-10')).toBe(true);
  });

  it('CT-ASS-101 cria o documento de conclusão com as assinaturas informadas', () => {
    expect(criarDocumentos('c-1', '2026-01-01')).toEqual([
      {
        id: 'c-1-d1',
        colaboradorId: 'c-1',
        tipo: 'conclusao',
        titulo: 'Termo de conclusão do onboarding',
        criadoEm: '2026-02-05',
        assinadoColaboradorEm: undefined,
        assinadoGestorEm: undefined,
      },
    ]);
    expect(criarDocumentos('c-1', '2026-01-01', ['2026-02-06', '2026-02-07'])[0]).toMatchObject({
      assinadoColaboradorEm: '2026-02-06',
      assinadoGestorEm: '2026-02-07',
    });
  });
});
