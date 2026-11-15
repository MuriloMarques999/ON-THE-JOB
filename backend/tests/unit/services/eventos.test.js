jest.mock('../../../src/config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../../../src/config/jornada', () => ({
  hojeISO: jest.fn(() => '2026-03-10'),
}));

const db = require('../../../src/config/db');
const { registrarEvento } = require('../../../src/services/eventos');

describe('CT-RH registro de eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CT-RH-003 registra texto e data de hoje usando a conexão padrão', async () => {
    await registrarEvento('Cadastro realizado');

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO evento (texto, data) VALUES (?, ?)',
      ['Cadastro realizado', '2026-03-10']
    );
  });

  it('CT-RH-004 registra evento usando a conexão recebida', async () => {
    const conexao = { query: jest.fn().mockResolvedValue([{}]) };

    await registrarEvento('Assinatura concluída', conexao);

    expect(conexao.query).toHaveBeenCalledWith(
      'INSERT INTO evento (texto, data) VALUES (?, ?)',
      ['Assinatura concluída', '2026-03-10']
    );
    expect(db.query).not.toHaveBeenCalled();
  });
});
