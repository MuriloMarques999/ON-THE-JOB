const test = require('node:test');
const assert = require('node:assert/strict');
const { criarAtividades, somarDias, DIAS_DA_JORNADA } = require('../src/config/jornada');

test('somarDias trata virada de mês, ano e ano bissexto', () => {
  assert.equal(somarDias('2026-01-30', 3), '2026-02-02');
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(somarDias('2024-02-28', 1), '2024-02-29');
});

test('criarAtividades gera 25 atividades distribuídas em cinco semanas', () => {
  const atividades = criarAtividades('2026-01-01');

  assert.equal(atividades.length, 25);
  assert.deepEqual(
    atividades.reduce((contagem, atividade, indice) => {
      contagem[Math.floor(indice / 5)] += 1;
      return contagem;
    }, [0, 0, 0, 0, 0]),
    [5, 5, 5, 5, 5]
  );
  assert.equal(atividades[0].inicio, '2026-01-02');
  assert.equal(atividades[0].prazo, '2026-01-04');
});

test('prazos das atividades não ultrapassam o último dia da jornada', () => {
  const atividades = criarAtividades('2026-01-01');
  const ultimoDia = somarDias('2026-01-01', DIAS_DA_JORNADA);

  assert.ok(atividades.every((atividade) => atividade.prazo <= ultimoDia));
  assert.equal(atividades.at(-1).prazo, ultimoDia);
});
