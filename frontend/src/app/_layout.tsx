import { Stack } from 'expo-router';

import { AuthProvider, useAuth } from '@/context/auth-context';

function Routes() {
  const { user } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Só acessível quando NÃO está logado */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="index" />
      </Stack.Protected>

      {/* Cada área só abre para o perfil correspondente */}
      <Stack.Protected guard={user?.role === 'rh'}>
        <Stack.Screen name="rh" />
      </Stack.Protected>
      <Stack.Protected guard={user?.role === 'colaborador'}>
        <Stack.Screen name="colaborador/index" />
      </Stack.Protected>
      <Stack.Protected guard={user?.role === 'gestor'}>
        <Stack.Screen name="gestor/index" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}