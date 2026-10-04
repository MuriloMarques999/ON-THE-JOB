import { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'rh' | 'colaborador' | 'gestor';

export type User = { nome: string; email: string; role: Role };

type LoginResult = { ok: true } | { ok: false; error: string };

type AuthContextType = {
  user: User | null;
  login: (data: { role: Role; email: string; senha: string }) => LoginResult;
  logout: () => void;
};

// Usuários de teste. Troque por chamada ao seu backend (pasta /backend) quando estiver pronto.
const USERS: (User & { senha: string })[] = [
  { nome: 'Equipe RH', email: 'rh@platform.com', senha: '123456', role: 'rh' },
  { nome: 'Colaborador', email: 'colaborador@platform.com', senha: '123456', role: 'colaborador' },
  { nome: 'Gestor', email: 'gestor@platform.com', senha: '123456', role: 'gestor' },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  function login({ role, email, senha }: { role: Role; email: string; senha: string }): LoginResult {
    const found = USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha
    );
    if (!found) return { ok: false, error: 'E-mail ou senha incorretos.' };
    if (found.role !== role)
      return { ok: false, error: 'Este usuário não tem acesso ao perfil selecionado.' };

    setUser({ nome: found.nome, email: found.email, role: found.role });
    return { ok: true };
  }

  function logout() {
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
