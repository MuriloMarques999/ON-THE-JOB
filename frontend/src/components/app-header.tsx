import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';

// Cabeçalho compartilhado pelas telas internas (menu, logo e perfil).
// O ícone de menu abre um pequeno menu logo abaixo dele: "Termos de uso" (consulta do termo aceito) e "Sair".
export function AppHeader({ perfil }: { perfil: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const botao = useRef<View>(null);
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState({ top: 56, left: 16 });

  function abrir() {
    // Mede onde o ícone está na tela para encaixar o menu logo abaixo dele
    botao.current?.measureInWindow((x, y, _largura, altura) => {
      setPosicao({ top: y + altura + 6, left: Math.max(8, x - 8) });
      setAberto(true);
    });
  }

  function verTermos() {
    setAberto(false);
    router.push('/termos' as Href);
  }

  function sair() {
    setAberto(false);
    logout();
  }

  return (
    <View style={s.header}>
      <Pressable ref={botao} accessibilityLabel="Abrir menu" accessibilityRole="button" hitSlop={8} onPress={abrir}>
        <MaterialCommunityIcons name="menu" size={28} color="#3B8D9C" />
      </Pressable>

      <View style={s.logo}>
        <Text style={s.logoText}>OJ</Text>
      </View>

      <View style={s.perfil}>
        <Text style={s.perfilLabel}>Perfil</Text>
        <Text style={s.perfilNome}>{perfil}</Text>
      </View>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        {/* Tocar fora do menu fecha */}
        <Pressable style={s.fundo} onPress={() => setAberto(false)} accessibilityLabel="Fechar menu">
          <View style={[s.menu, { top: posicao.top, left: posicao.left }]}>
            {!!user && (
              <View style={s.usuario}>
                <Text style={s.usuarioNome} numberOfLines={1}>
                  {user.nome}
                </Text>
                <Text style={s.usuarioEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            )}

            <Pressable style={s.opcao} onPress={verTermos} accessibilityRole="button">
              <MaterialCommunityIcons name="shield-check-outline" size={18} color="#25626B" />
              <Text style={[s.opcaoTexto, { color: '#25626B' }]}>Termos de uso</Text>
            </Pressable>

            <Pressable style={s.opcao} onPress={sair} accessibilityRole="button">
              <MaterialCommunityIcons name="logout" size={18} color="#8A2B2B" />
              <Text style={s.opcaoTexto}>Sair</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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

  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.12)' },
  menu: { position: 'absolute', minWidth: 190, maxWidth: 280, paddingVertical: 6, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0D0D0', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  usuario: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E2E2' },
  usuarioNome: { fontSize: 12, fontWeight: '800', color: '#111' },
  usuarioEmail: { marginTop: 1, fontSize: 10, color: '#555' },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  opcaoTexto: { fontSize: 13, fontWeight: '700', color: '#8A2B2B' },
});