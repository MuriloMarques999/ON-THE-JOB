import { API_URL, aoExpirar, api, definirToken } from '../../src/services/api';

const resposta = (status: number, corpo: string) => new Response(corpo, { status });
const fetchMock = () => globalThis.fetch as jest.MockedFunction<typeof fetch>;

describe('cliente HTTP da API', () => {
  let fetchOriginal: typeof fetch;

  beforeEach(() => {
    fetchOriginal = globalThis.fetch;
    globalThis.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    aoExpirar(null);
    definirToken(null);
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    aoExpirar(null);
    definirToken(null);
  });

  it('CT-API-201 faz GET sem corpo e interpreta a resposta JSON', async () => {
    fetchMock().mockResolvedValue(resposta(200, JSON.stringify({ nome: 'Anne' })));

    await expect(api.get<{ nome: string }>('/teste')).resolves.toEqual({
      ok: true,
      dados: { nome: 'Anne' },
      status: 200,
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(`${API_URL}/teste`, {
      method: 'GET',
      headers: {},
      body: undefined,
    });
  });

  it('CT-API-202 envia token e serializa o corpo JSON de POST', async () => {
    definirToken('token-de-teste');
    fetchMock().mockResolvedValue(resposta(201, JSON.stringify({ id: 'c-10' })));

    await expect(api.post<{ id: string }>('/colaboradores', { nome: 'Ana' })).resolves.toEqual({
      ok: true,
      dados: { id: 'c-10' },
      status: 201,
    });

    const [, init] = fetchMock().mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: expect.stringContaining('token-de-teste'),
    });
    expect(init?.body).toBe(JSON.stringify({ nome: 'Ana' }));
  });

  it('CT-API-203 repassa erro HTTP, trata resposta sem JSON e notifica sessão expirada', async () => {
    const expirada = jest.fn();
    definirToken('sessao-expirada');
    aoExpirar(expirada);
    fetchMock().mockResolvedValue(resposta(401, 'resposta sem JSON'));

    await expect(api.get('/privado')).resolves.toEqual({
      ok: false,
      erro: 'Não foi possível concluir a ação. Tente novamente.',
      status: 401,
    });
    expect(expirada).toHaveBeenCalledTimes(1);
  });

  it('CT-API-204 não encerra sessão por 401 durante login e informa falha de rede', async () => {
    const expirada = jest.fn();
    definirToken(null);
    aoExpirar(expirada);
    fetchMock().mockResolvedValue(resposta(401, JSON.stringify({ erro: 'Credenciais inválidas.' })));

    await expect(api.post('/auth/login', { senha: 'incorreta' })).resolves.toMatchObject({
      ok: false,
      erro: 'Credenciais inválidas.',
      status: 401,
    });
    expect(expirada).not.toHaveBeenCalled();

    fetchMock().mockRejectedValue(new Error('rede indisponível'));
    await expect(api.get('/teste')).resolves.toEqual({
      ok: false,
      erro: 'Não foi possível conectar ao servidor.',
      status: 0,
    });
  });
});
