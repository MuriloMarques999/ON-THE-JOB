type ModuloMockApi = typeof import('../../src/services/mock-api');

describe('API simulada sem backend', () => {
  const mockEnvAnterior = process.env.EXPO_PUBLIC_MOCK;
  let mockApi: ModuloMockApi;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    process.env.EXPO_PUBLIC_MOCK = '1';
    jest.isolateModules(() => {
      mockApi = jest.requireActual<ModuloMockApi>('../../src/services/mock-api');
    });
    mockApi.apagarDadosTeste();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (mockEnvAnterior === undefined) delete process.env.EXPO_PUBLIC_MOCK;
    else process.env.EXPO_PUBLIC_MOCK = mockEnvAnterior;
  });

  async function responder(
    metodo: 'GET' | 'POST',
    caminho: string,
    corpo: unknown = {},
    token: string | null = null
  ) {
    const respostaPendente = mockApi.responderMock(metodo, caminho, corpo, token);
    await jest.advanceTimersByTimeAsync(150);
    return respostaPendente;
  }

  it('CT-MCK-101 ativa o modo mock no import e aplica o atraso de rede sem backend', async () => {
    expect(mockApi.MODO_TESTE).toBe(true);

    const respostaPendente = mockApi.responderMock('GET', '/rh/home', {}, null);
    let resolvida = false;
    void respostaPendente.then(() => {
      resolvida = true;
    });
    await jest.advanceTimersByTimeAsync(149);
    expect(resolvida).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await expect(respostaPendente).resolves.toMatchObject({
      status: 401,
      json: { erro: 'Faça login para continuar.' },
    });
  });

  it('CT-MCK-102 autentica seed, exige aceite dos termos e então responde a rota RH', async () => {
    const login = await responder('POST', '/auth/login', {
      role: 'rh',
      email: ' RH@PLATFORM.COM ',
      senha: '123456',
    });
    expect(login.status).toBe(200);
    expect(login.json).toMatchObject({
      usuario: { nome: 'Camila Rocha', role: 'rh', termosAceitos: false },
    });
    const token = (login.json as { token: string }).token;

    await expect(responder('GET', '/rh/home', {}, token)).resolves.toMatchObject({
      status: 403,
      json: { erro: 'Aceite os termos de uso para acessar a plataforma.' },
    });
    const aceite = await responder('POST', '/auth/aceitar-termos', { aceito: true }, token);
    expect(aceite).toMatchObject({
      status: 200,
      json: { usuario: { termosAceitos: true } },
    });

    await expect(responder('GET', '/rh/home', {}, token)).resolves.toMatchObject({
      status: 200,
      json: {
        contagens: { emOnboarding: expect.any(Number), concluidas: expect.any(Number) },
      },
    });
  });

  it('CT-MCK-103 valida credenciais e perfil selecionado no login simulado', async () => {
    await expect(
      responder('POST', '/auth/login', { role: 'rh', email: 'inexistente@platform.com', senha: 'x' })
    ).resolves.toMatchObject({
      status: 401,
      json: { erro: 'E-mail ou senha incorretos.' },
    });
    await expect(
      responder('POST', '/auth/login', { role: 'gestor', email: 'rh@platform.com', senha: '123456' })
    ).resolves.toMatchObject({
      status: 403,
      json: { erro: 'Este usuário não tem acesso ao perfil selecionado.' },
    });
  });
});
