import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';

// Cabeçalho compartilhado pelas telas internas (menu, logo e perfil).
export function AppHeader({ perfil }: { perfil: string }) {
  const { logout } = useAuth();

  return (
    <View style={s.header}>
      <Pressable accessibilityLabel="Abrir menu" hitSlop={8} onPress={() => {}}>
        <MaterialCommunityIcons name="menu" size={28} color="#3B8D9C" />
      </Pressable>

      <View style={s.logo}>
        <Text style={s.logoText}>OJ</Text>
      </View>

      {/* Provisório: tocar em "Perfil" faz logout, para facilitar os testes */}
      <Pressable onPress={logout} style={s.perfil} accessibilityLabel={`Perfil ${perfil}. Tocar para sair`}>
        <Text style={s.perfilLabel}>Perfil</Text>
        <Text style={s.perfilNome}>{perfil}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#E2E2E2' },
  logo: { position: 'absolute', left: 52, width: 32, height: 32, borderRadius: 16, backgroundColor: '#4AA3B3', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 11, fontWeight: '500' },
  perfil: { alignItems: 'flex-end' },
  perfilLabel: { fontSize: 11, color: '#222' },
  perfilNome: { fontSize: 13, fontWeight: '800', color: '#111' },
});
