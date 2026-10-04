import { StyleSheet, Text, View } from 'react-native';

// Marca "On the job" (logo + nome + slogan). Usada no login e na conclusão de conta.
export function BrandHeader() {
  return (
    <View style={s.brand}>
      <View style={s.logo}>
        <Text style={s.logoText}>OJ</Text>
      </View>
      <Text style={s.brandName}>On the job</Text>
      <Text style={s.tagline}>Novo colaborador, nova jornada digital.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  brand: { alignItems: 'center' },
  logo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4AA3B3', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logoText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  brandName: { fontSize: 36, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  tagline: { fontSize: 10, color: '#111', marginTop: 2 },
});
