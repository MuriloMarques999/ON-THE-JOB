import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { aoExpirar, api, definirToken } from '@/services/api';

export type Role = 'rh' | 'colaborador' | 'gestor';

export type User = { nome: string; email: string; role: Role };

type LoginResult = { ok: true } | { ok: false; error: string };

type AuthContextType = {
  user: User | null;
  login: (data: { role: Role; email: string; senha: string }) => Promise<LoginResult>;
  // Conclusão de cadastro pelo link do convite: `token` vem na URL do convite
  criarConta: (data: { email: string; token: string; senha: string }) => Promise<LoginResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// "Anne Carlini de Oliveira" -> "Anne" (usado nas saudações das telas iniciais)
export function primeiroNomeDe(nome?: string) {
  return nome?.trim().split(/\s+/)[0] ?? '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    definirToken(null);
    setUser(null);
  }, []);

  // Sessão expirada (o servidor devolveu 401): volta para o login
  useEffect(() => {
    aoExpirar(logout);
    return () => aoExpirar(null);
  }, [logout]);

  // POST /auth/login -> { token, usuario: { nome, email, role } }
  // O bloqueio por 3 senhas erradas (15 min) e as mensagens de erro vêm do servidor.
  const login = useCallback(async ({ role, email, senha }: { role: Role; email: string; senha: string }): Promise<LoginResult> => {
    const r = await api.post<{ token: string; usuario: User }>('/auth/login', { role, email: email.trim(), senha });
    if (!r.ok) return { ok: false, error: r.erro };

    definirToken(r.dados.token);
    setUser(r.dados.usuario);
    return { ok: true };
  }, []);

  // POST /auth/concluir-conta: define a senha e ativa a conta (o convite vale 7 dias e é de uso único)
  const criarConta = useCallback(async ({ email, token, senha }: { email: string; token: string; senha: string }): Promise<LoginResult> => {
    const r = await api.post('/auth/concluir-conta', { email: email.trim(), token, senha });
    return r.ok ? { ok: true } : { ok: false, error: r.erro };
  }, []);

  const value = useMemo(() => ({ user, login, criarConta, logout }), [user, login, criarConta, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}