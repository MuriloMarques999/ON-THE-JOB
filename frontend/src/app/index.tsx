import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth, type Role } from '@/context/auth-context';

const PERFIS: { id: Role; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: 'rh', label: 'RH', icon: 'account-multiple-outline' },
  { id: 'colaborador', label: 'Colaborador', icon: 'account-outline' },
  { id: 'gestor', label: 'Gestor', icon: 'chair-rolling' },
];

export default function LoginScreen() {
  const { user, login } = useAuth();
  const [perfil, setPerfil] = useState<Role>('rh');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  // Se o uusáiro estiver logado, vai direto para a área do perfil.
  if (user) return <Redirect href={`/${user.role}` as Href} />;

  function entrar() {
    const result = login({ role: perfil, email, senha });
    if (!result.ok) setErro(result.error);
    // Sucesso: o estado `user` muda e o <Redirect> acima leva para /rh, /colaborador ou /gestor.
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Marca */}
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>OJ</Text>
            </View>
            <Text style={styles.brandName}>On the job</Text>
            <Text style={styles.tagline}>Novo colaborador, nova jornada digital.</Text>
          </View>

          {/* Título */}
          <View style={styles.intro}>
            <Text style={styles.title}>Entrar na plataforma</Text>
            <Text style={styles.subtitle}>Selecione um perfil para acesso.</Text>
          </View>

          {/* Perfis */}
          <View style={styles.perfis} accessibilityRole="radiogroup">
            {PERFIS.map((p) => {
              const ativo = perfil === p.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  onPress={() => {
                    setPerfil(p.id);
                    setErro('');
                  }}
                  style={[styles.perfil, ativo && styles.perfilAtivo]}>
                  <MaterialCommunityIcons name={p.icon} size={30} color={TEAL} />
                  <Text style={styles.perfilLabel}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Campos */}
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="perfil.teste@platform.com"
            placeholderTextColor="#8a8a8a"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErro('');
            }}
          />

          <Text style={[styles.label, { marginTop: 18 }]}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••••••••"
            placeholderTextColor="#8a8a8a"
            secureTextEntry
            value={senha}
            onChangeText={(t) => {
              setSenha(t);
              setErro('');
            }}
            onSubmitEditing={entrar}
          />

          {!!erro && <Text style={styles.erro}>{erro}</Text>}

          <Pressable style={styles.entrar} onPress={entrar}>
            <Text style={styles.entrarText}>Entrar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TEAL = '#3B8D9C';
const TEAL_ESCURO = '#25626B';
const SUPERFICIE = '#D9D9D9';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, width: '100%', maxWidth: 480, alignSelf: 'center' },

  brand: { alignItems: 'center' },
  logo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4AA3B3', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logoText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  brandName: { fontSize: 36, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  tagline: { fontSize: 10, color: '#111', marginTop: 2 },

  intro: { alignItems: 'center', marginTop: 44 },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 14, color: '#333', marginTop: 4 },

  perfis: { marginTop: 28, gap: 12 },
  perfil: { flexDirection: 'row', alignItems: 'center', gap: 28, height: 48, paddingHorizontal: 24, borderRadius: 12, backgroundColor: SUPERFICIE },
  perfilAtivo: { elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  perfilLabel: { fontSize: 16, fontWeight: '800', color: '#111' },

  label: { marginTop: 44, marginBottom: 6, fontSize: 12, fontWeight: '800', color: '#111' },
  input: { height: 40, paddingHorizontal: 10, borderRadius: 6, backgroundColor: SUPERFICIE, fontSize: 13, color: '#111' },

  erro: { marginTop: 14, textAlign: 'center', color: '#B3261E', fontSize: 13 },

  entrar: { alignSelf: 'center', width: 260, height: 44, marginTop: 44, borderRadius: 6, backgroundColor: TEAL_ESCURO, alignItems: 'center', justifyContent: 'center' },
  entrarText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});
