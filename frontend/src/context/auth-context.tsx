import { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'rh' | 'colaborador' | 'gestor';

export type User = { nome: string; email: string; role: Role };

type LoginResult = { ok: true } | { ok: false; error: string };

type AuthContextType = {
  user: User | null;
  login: (data: { role: Role; email: string; senha: string }) => LoginResult;
  criarConta: (data: { role: Exclude<Role, 'rh'>; email: string; senha: string; nome?: string }) => LoginResult;
  logout: () => void;
};

// ⚠️ Usuários de teste (em memória). Troque por chamadas ao backend quando estiver pronto.
const USERS: (User & { senha: string })[] = [
  { nome: 'Camila Rocha', email: 'rh@platform.com', senha: '123456', role: 'rh' },
  { nome: 'Anne Carlini', email: 'colaborador@platform.com', senha: '123456', role: 'colaborador' },
  { nome: 'João Nogueira', email: 'gestor@platform.com', senha: '123456', role: 'gestor' },
];

const AuthContext = createContext<AuthContextType | null>(null);

// "Anne Carlini de Oliveira" -> "Anne" (usado nas saudações das telas iniciais)
export function primeiroNomeDe(nome?: string) {
  return nome?.trim().split(/\s+/)[0] ?? '';
}

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

  // SIMULAÇÃO da conclusão de cadastro: guarda a conta só em memória (some ao recarregar o app).
  function criarConta({ role, email, senha, nome }: { role: Exclude<Role, 'rh'>; email: string; senha: string; nome?: string }): LoginResult {
    const emailNorm = email.trim().toLowerCase();
    if (USERS.some((u) => u.email.toLowerCase() === emailNorm))
      return { ok: false, error: 'Já existe uma conta com este e-mail.' };

    // Nome completo informado pelo RH no cadastro; se não vier, usa a parte inicial do e-mail.
    const parte = emailNorm.split('@')[0];
    const nomeCompleto = nome?.trim() || parte.charAt(0).toUpperCase() + parte.slice(1);
    USERS.push({ nome: nomeCompleto, email: emailNorm, senha, role });
    return { ok: true };
  }

  function logout() {
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, criarConta, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
