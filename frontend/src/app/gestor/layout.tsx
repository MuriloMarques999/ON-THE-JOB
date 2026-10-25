import { Stack } from 'expo-router';

// Navegação interna da área do gestor.
export default function GestorLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}