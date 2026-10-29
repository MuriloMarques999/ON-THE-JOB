const test = require('node:test');
const assert = require('node:assert/strict');
const {
  dataFimJornada,
  paraItem,
  progresso,
  resumoSemanas,
  statusAtividade,
} = require('../src/config/regras');

const atividadeBase = {
  id: 'a1',
  semana: 1,
  titulo: 'Apresentação da empresa',
  envolvidos: 'RH - Colaborador',
  inicio: '2026-03-02',
  prazo: '2026-03-04',
};

test('status da atividade respeita conclusão, prazo e início', () => {
  assert.equal(statusAtividade(atividadeBase, '2026-03-01'), 'pendente');
  assert.equal(statusAtividade({ ...atividadeBase, iniciadaEm: '2026-03-02' }, '2026-03-03'), 'em_andamento');
  assert.equal(statusAtividade(atividadeBase, '2026-03-05'), 'atrasada');
  assert.equal(
    statusAtividade({ ...atividadeBase, concluidaEm: '2026-03-06' }, '2026-03-07'),
    'concluida'
  );
});

test('início pode ocorrer na data inicial e conclusão tardia é identificada', () => {
  assert.equal(paraItem(atividadeBase, '2026-03-01').podeIniciar, false);
  assert.equal(paraItem(atividadeBase, '2026-03-02').podeIniciar, true);
  assert.equal(paraItem({ ...atividadeBase, concluidaEm: '2026-03-05' }, '2026-03-06').comAtraso, true);
  assert.equal(paraItem({ ...atividadeBase, concluidaEm: '2026-03-04' }, '2026-03-06').comAtraso, false);
});

test('paraItem reúne status e possibilidade de início', () => {
  assert.deepEqual(paraItem(atividadeBase, '2026-03-02'), {
    ...atividadeBase,
    status: 'pendente',
    comAtraso: false,
    podeIniciar: true,
  });
});

test('progresso calcula total, conclusão e percentual, inclusive sem atividades', () => {
  const atividades = [
    { concluidaEm: '2026-03-01' },
    { concluidaEm: undefined },
    { concluidaEm: '2026-03-02' },
  ];

  assert.deepEqual(progresso(atividades), { total: 3, concluidas: 2, percentual: 67 });
  assert.deepEqual(progresso([]), { total: 0, concluidas: 0, percentual: 0 });
});

test('resumoSemanas lista atividades concluídas por semana', () => {
  assert.deepEqual(
    resumoSemanas([
      { semana: 1, titulo: 'Atividade concluída', concluidaEm: '2026-03-03' },
      { semana: 1, titulo: 'Atividade pendente' },
      { semana: 2, titulo: 'Outra concluída', concluidaEm: '2026-03-04' },
    ]),
    [
      { semana: 1, tema: 'Apresentação da empresa', atividades: ['Atividade concluída'] },
      { semana: 2, tema: 'Integração com a equipe', atividades: ['Outra concluída'] },
    ]
  );
});

test('data final da jornada é calculada a partir da data de admissão', () => {
  assert.equal(dataFimJornada('2026-03-01'), '2026-03-31');
});
