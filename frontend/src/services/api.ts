import { Platform } from 'react-native';

/*
 * CLIENTE DA API (backend em Node/Express)
 * Todas as chamadas ao servidor passam por aqui. O token de login (JWT) fica guardado em memória
 * e é enviado em todas as requisições; se o servidor responder 401 com o usuário logado
 * (sessão expirada), o usuário é deslogado.
 *
 * Endereço da API:
 *  - navegador e iOS (simulador): http://localhost:3000
 *  - emulador Android: http://10.0.2.2:3000
 *  - celular físico: defina EXPO_PUBLIC_API_URL com o IP do computador (ex.: http://192.168.0.10:3000)
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

export type RespostaApi<T> =
  | { ok: true; dados: T; status: number }
  | { ok: false; erro: string; status: number };

let token: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

export function definirToken(novo: string | null) {
  token = novo;
}

// Registra o que fazer quando o servidor disser que a sessão expirou (o AuthProvider faz o logout)
export function aoExpirar(fn: (() => void) | null) {
  aoExpirarSessao = fn;
}

async function chamar<T>(metodo: 'GET' | 'POST', caminho: string, corpo?: unknown): Promise<RespostaApi<T>> {
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: {
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });

    let json: unknown = null;
    try {
      json = await resposta.json();
    } catch {
      // resposta sem corpo
    }

    if (resposta.ok) return { ok: true, dados: json as T, status: resposta.status };

    // Sessão expirada (só vale com alguém logado; no login, 401 significa senha incorreta)
    if (resposta.status === 401 && token) aoExpirarSessao?.();

    const mensagem = (json as { erro?: string } | null)?.erro;
    return { ok: false, erro: mensagem ?? 'Não foi possível concluir a ação. Tente novamente.', status: resposta.status };
  } catch {
    return { ok: false, erro: 'Não foi possível conectar ao servidor.', status: 0 };
  }
}

export const api = {
  get: <T>(caminho: string) => chamar<T>('GET', caminho),
  post: <T = { ok: true }>(caminho: string, corpo?: unknown) => chamar<T>('POST', caminho, corpo ?? {}),
};