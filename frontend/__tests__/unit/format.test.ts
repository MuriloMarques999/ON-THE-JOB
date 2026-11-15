import {
  formatarData,
  formatarDataCurta,
  STATUS_ASSINATURA,
  STATUS_ATIVIDADE,
  STATUS_JORNADA,
  ROTULO_FILTRO_JORNADA,
  textoPrazo,
} from '../../src/data/format';

describe('formatação e rótulos', () => {
  it('CT-API-101 formata datas completas e vazias', () => {
    expect(formatarData('2026-09-01')).toBe('01/09/2026');
    expect(formatarData(undefined)).toBe('');
    expect(formatarData('')).toBe('');
  });

  it('CT-API-102 formata datas curtas e os três estados do prazo', () => {
    expect(formatarDataCurta('2026-10-03')).toBe('03/10');
    expect(textoPrazo('2026-03-10', '2026-03-10')).toBe('vence hoje');
    expect(textoPrazo('2026-03-09', '2026-03-10')).toBe('venceu em 09/03');
    expect(textoPrazo('2026-03-11', '2026-03-10')).toBe('até 11/03');
  });

  it('CT-API-103 expõe mapas completos de status e filtros', () => {
    expect(Object.keys(STATUS_ATIVIDADE).sort()).toEqual([
      'atrasada',
      'concluida',
      'em_andamento',
      'pendente',
    ]);
    expect(Object.keys(STATUS_JORNADA).sort()).toEqual([
      'atrasada',
      'concluida',
      'em_andamento',
      'pendente',
    ]);
    expect(Object.keys(STATUS_ASSINATURA).sort()).toEqual(['concluido', 'pendente']);
    expect(ROTULO_FILTRO_JORNADA).toEqual({
      em_onboarding: 'Colaboradores em onboarding',
      concluidas: 'Jornadas concluídas',
      atrasadas: 'Jornadas atrasadas',
    });
  });
});
