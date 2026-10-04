import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { BrandHeader } from '@/components/brand-header';
import { SuccessBanner } from '@/components/success-banner';
import { useAuth, type Role } from '@/context/auth-context';

const PERFIS: { id: Role; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: 'rh', label: 'RH', icon: 'account-multiple-outline' },
  { id: 'colaborador', label: 'Colaborador', icon: 'account-outline' },
  { id: 'gestor', label: 'Gestor', icon: 'chair-rolling' },
];

export default function LoginScreen() {
  const { user, login } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ conta?: string; perfil?: string }>();
  const perfilInicial: Role = params.perfil === 'colaborador' || params.perfil === 'gestor' ? params.perfil : 'rh';
  const [perfil, setPerfil] = useState<Role>(perfilInicial);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  // Vindo da conclusão de cadastro: mostra "Conta criada com sucesso!"
  const [avisoConta, setAvisoConta] = useState(params.conta === 'criada');
  useEffect(() => {
    if (params.conta === 'criada') setAvisoConta(true);
  }, [params.conta]);

  function fecharAviso() {
    setAvisoConta(false);
    router.setParams({ conta: '' });
  }

  // Já logado? vai direto para a área do perfil.
    if (user) return <Redirect href={`/${user.role}` as Href} />;

  function entrar() {
    const result = login({ role: perfil, email, senha });
    if (!result.ok) setErro(result.error);
    // Sucesso: o estado `user` muda e o <Redirect> acima leva para a área do perfil.
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BrandHeader />

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

      <SuccessBanner
        visible={avisoConta}
        titulo="Conta criada com sucesso!"
        mensagem="Faça seu login para acessar a plataforma."
        onClose={fecharAviso}
      />
    </SafeAreaView>
  );
}

const TEAL = '#3B8D9C';
const TEAL_ESCURO = '#25626B';
const SUPERFICIE = '#D9D9D9';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, width: '100%', maxWidth: 480, alignSelf: 'center' },


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
