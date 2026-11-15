const jwt = require('jsonwebtoken');
const {
  autenticar,
  autenticarSemTermos,
  exigeRole,
} = require('../../../src/middlewares/auth');

const tokenValido = (sobrescritos = {}, opcoes = {}) =>
  jwt.sign(
    { id: 7, role: 'gestor', termos: true, ...sobrescritos },
    process.env.JWT_SECRET,
    { expiresIn: '1h', ...opcoes }
  );

function requisicao(authorization) {
  return { headers: authorization === undefined ? {} : { authorization } };
}

function resposta() {
  const res = {
    statusCode: undefined,
    body: undefined,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(corpo) {
      this.body = corpo;
      return this;
    },
  };
  return res;
}

describe('CT-SEG autenticação e autorização por perfil', () => {
  it.each([
    ['sem cabeçalho', undefined, 'Faça login para continuar.'],
    ['esquema Basic', 'Basic token', 'Faça login para continuar.'],
    ['token inválido', 'Bearer token-invalido', 'Sessão expirada. Faça login novamente.'],
    ['token expirado', `Bearer ${tokenValido({}, { expiresIn: -1 })}`, 'Sessão expirada. Faça login novamente.'],
    [
      'token adulterado',
      `Bearer ${tokenValido()}x`,
      'Sessão expirada. Faça login novamente.',
    ],
  ])('CT-SEG-001 rejeita %s com 401', (_caso, header, erro) => {
    const req = requisicao(header);
    const res = resposta();
    const next = jest.fn();

    autenticarSemTermos(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ erro });
    expect(next).not.toHaveBeenCalled();
  });

  it('CT-SEG-002 valida token e disponibiliza usuário na requisição', () => {
    const req = requisicao(`Bearer ${tokenValido()}`);
    const res = resposta();
    const next = jest.fn();

    autenticarSemTermos(req, res, next);

    expect(req.usuario).toMatchObject({ id: 7, role: 'gestor', termos: true });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeUndefined();
  });

  it('CT-SEG-003 autenticar exige aceite dos termos', () => {
    const req = requisicao(`Bearer ${tokenValido({ termos: false })}`);
    const res = resposta();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({
      erro: 'Aceite os termos de uso para acessar a plataforma.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('CT-SEG-004 autenticar permite usuário com termos aceitos', () => {
    const req = requisicao(`Bearer ${tokenValido()}`);
    const res = resposta();
    const next = jest.fn();

    autenticar(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeUndefined();
  });

  it.each([
    [['gestor'], 'gestor', true],
    [['rh'], 'gestor', false],
    [['rh', 'gestor'], 'gestor', true],
  ])('CT-SEG-005 verifica acesso aos perfis permitidos', (roles, roleUsuario, permitido) => {
    const req = { usuario: { role: roleUsuario } };
    const res = resposta();
    const next = jest.fn();

    exigeRole(...roles)(req, res, next);

    if (permitido) {
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBeUndefined();
    } else {
      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ erro: 'Você não tem permissão para esta ação.' });
      expect(next).not.toHaveBeenCalled();
    }
  });
});
