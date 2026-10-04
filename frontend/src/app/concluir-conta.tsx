import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
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

import { BrandHeader } from '@/components/brand-header';
import { Campo, EMAIL_RE, formStyles, PLACEHOLDER } from '@/components/form-campo';
import { useAuth } from '@/context/auth-context';

/*
 * Tela aberta pelo link do e-mail de convite.
 *
 *   /concluir-conta?perfil=gestor&email=joao@empresa.com&token=abc123
 *
 * - `perfil` define o fluxo (colaborador ou gestor).
 * - `email` é o e-mail que o RH cadastrou (SIMULAÇÃO: no backend real o link leva só o `token`,
 *   e é o servidor que descobre o e-mail do convite e compara com o digitado).
 */

const PERFIS = {
  colaborador: { label: 'Colaborador', icon: 'account-outline' },
  gestor: { label: 'Gestor', icon: 'chair-rolling' },
} as const;

type PerfilConvite = keyof typeof PERFIS;

const REGRAS: { texto: string; ok: (senha: string) => boolean }[] = [
  { texto: 'Pelo menos 8 caracteres', ok: (s) => s.length >= 8 },
  { texto: 'Pelo menos 1 letra maiúscula', ok: (s) => /[A-Z]/.test(s) },
  { texto: 'Pelo menos 1 letra minúscula', ok: (s) => /[a-z]/.test(s) },
  { texto: 'Pelo menos 1 dígito numérico', ok: (s) => /\d/.test(s) },
  { texto: 'Pelo menos 1 caractere especial', ok: (s) => /[^A-Za-z0-9]/.test(s) },
];

const um = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export default function ConcluirConta() {
  const router = useRouter();
  const { criarConta } = useAuth();
  const params = useLocalSearchParams<{ perfil?: string; email?: string; token?: string }>();

  const perfilParam = um(params.perfil);
  const emailConvite = um(params.email)?.trim() ?? '';
  const perfil: PerfilConvite | null = perfilParam === 'colaborador' || perfilParam === 'gestor' ? perfilParam : null;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});

  // Link sem perfil válido ou sem e-mail de convite
  if (!perfil || !emailConvite) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <BrandHeader />
          <Text style={[s.titulo, { marginTop: 48 }]}>Link inválido.</Text>
          <Text style={s.aviso}>Este link de convite é inválido ou expirou. Peça um novo convite ao RH.</Text>
          <Pressable style={s.botao} onPress={() => router.replace('/' as Href)}>
            <Text style={s.botaoTexto}>Ir para o login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const config = PERFIS[perfil];

  function concluir() {
    const e: typeof erros = {};

    if (!EMAIL_RE.test(email.trim())) e.email = 'Informe um e-mail válido.';
    else if (email.trim().toLowerCase() !== emailConvite.toLowerCase())
      e.email = 'Este e-mail não corresponde ao convite recebido.';

    if (!REGRAS.every((r) => r.ok(senha))) e.senha = 'A senha ainda não atende a todos os requisitos.';

    setErros(e);
    if (Object.keys(e).length > 0) return;

    // TODO backend: enviar { token, email, senha } para a API.
    const resultado = criarConta({ role: perfil!, email, senha });
    if (!resultado.ok) {
      setErros({ email: resultado.error });
      return;
    }

    // Vai para o login, que mostra o aviso "Conta criada com sucesso!"
    router.replace({ pathname: '/', params: { conta: 'criada', perfil } } as Href);
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BrandHeader />

          <Text style={[s.titulo, { marginTop: 48 }]}>Conclua sua conta.</Text>

          {/* Perfil do convite (não editável) */}
          <View style={s.perfil}>
            <MaterialCommunityIcons name={config.icon} size={30} color={TEAL} />
            <Text style={s.perfilLabel}>{config.label}</Text>
          </View>

          <View style={s.form}>
            <Campo label="E-mail" erro={erros.email}>
              <TextInput
                style={formStyles.input}
                placeholder={perfil === 'gestor' ? 'Ex.: joao.nogueira@gmail.com' : 'Ex.: anne.carlini@gmail.com'}
                placeholderTextColor={PLACEHOLDER}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErros((x) => ({ ...x, email: undefined }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </Campo>

            <Campo label="Senha" erro={erros.senha}>
              <TextInput
                style={formStyles.input}
                placeholder="Insira sua senha forte"
                placeholderTextColor={PLACEHOLDER}
                value={senha}
                onChangeText={(t) => {
                  setSenha(t);
                  setErros((x) => ({ ...x, senha: undefined }));
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={concluir}
              />
            </Campo>

            {/* Requisitos da senha, atualizados enquanto digita */}
            <View style={s.regras}>
              {REGRAS.map((r) => {
                const ok = r.ok(senha);
                return (
                  <View key={r.texto} style={s.regra}>
                    <MaterialCommunityIcons
                      name={ok ? 'check-circle-outline' : 'circle-outline'}
                      size={14}
                      color={ok ? '#2E9E5B' : '#B5B5B5'}
                    />
                    <Text style={s.regraTexto}>{r.texto}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Pressable style={s.botao} onPress={concluir}>
            <Text style={s.botaoTexto}>Concluir registro</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TEAL = '#3B8D9C';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  container: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },

  titulo: { fontSize: 28, fontWeight: '800', color: '#111', textAlign: 'center' },
  aviso: { marginTop: 12, fontSize: 14, color: '#333', textAlign: 'center', lineHeight: 20 },

  perfil: { marginTop: 28, flexDirection: 'row', alignItems: 'center', gap: 28, height: 52, paddingHorizontal: 24, borderRadius: 16, backgroundColor: '#D9D9D9' },
  perfilLabel: { fontSize: 16, fontWeight: '800', color: '#111' },

  form: { marginTop: 56, gap: 16 },

  regras: { gap: 6, marginTop: 2 },
  regra: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  regraTexto: { fontSize: 11, color: '#222' },

  botao: { marginTop: 40, height: 44, borderRadius: 6, backgroundColor: '#25626B', alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '500' },
});
