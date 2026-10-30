import { Stack } from 'expo-router';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { DataProvider } from '@/data/data-context';

function Routes() {
  const { user } = useAuth();
  const liberado = !!user?.termosAceitos;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Só acessível quando NÃO está logado */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="concluir-conta" />
      </Stack.Protected>

      {/* Cada área só abre para o perfil correspondente, e só depois do aceite dos termos */}
      <Stack.Protected guard={liberado && user?.role === 'rh'}>
        <Stack.Screen name="rh" />
      </Stack.Protected>
      <Stack.Protected guard={liberado && user?.role === 'colaborador'}>
        <Stack.Screen name="colaborador" />
      </Stack.Protected>
      <Stack.Protected guard={liberado && user?.role === 'gestor'}>
        <Stack.Screen name="gestor" />
      </Stack.Protected>

      {/* Termos de uso / LGPD: obrigatório no primeiro acesso; depois, só para consulta (menu e Documentos).
          ATENÇÃO: precisa ficar DEPOIS das áreas. Ao logar, o Expo Router abre a primeira tela liberada
          desta lista; se os termos viessem antes, abririam em todo login, mesmo para quem já aceitou. */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="termos" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <Routes />
      </DataProvider>
    </AuthProvider>
  );
}