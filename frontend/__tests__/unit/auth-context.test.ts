import { primeiroNomeDe } from '../../src/context/auth-context';

describe('saudação do usuário', () => {
  it('CT-AUT-101 retorna o primeiro nome e trata nome vazio ou ausente', () => {
    expect(primeiroNomeDe('Anne Carlini de Oliveira')).toBe('Anne');
    expect(primeiroNomeDe('  João   Vitor  ')).toBe('João');
    expect(primeiroNomeDe('')).toBe('');
    expect(primeiroNomeDe('   ')).toBe('');
    expect(primeiroNomeDe()).toBe('');
  });
});
