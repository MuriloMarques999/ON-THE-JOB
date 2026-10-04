import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
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

import { AppHeader } from '@/components/app-header';
import { SuccessBanner } from '@/components/success-banner';
import { Campo, EMAIL_RE, formatarTelefone, formStyles, PLACEHOLDER } from '@/components/form-campo';

type Form = { nome: string; email: string; telefone: string; cargo: string };
type Erros = Partial<Record<keyof Form, string>>;

const VAZIO: Form = { nome: '', email: '', telefone: '', cargo: '' };

function validar(f: Form): Erros {
  const e: Erros = {};
  if (f.nome.trim().length < 3) e.nome = 'Informe o nome completo.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Informe um e-mail válido.';
  if (f.telefone.replace(/\D/g, '').length < 10) e.telefone = 'Informe o telefone com DDD.';
  if (!f.cargo.trim()) e.cargo = 'Informe o cargo.';
  return e;
}

export default function CadastrarGestor() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [sucesso, setSucesso] = useState(false);

  function alterar(campo: keyof Form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
    setSucesso(false);
  }

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/rh' as Href);
  }

  function cadastrar() {
    const e = validar(form);
    setErros(e);
    if (Object.keys(e).length > 0) return;

    // TODO backend: enviar `form` para a API. Por enquanto só simulamos o sucesso.
    console.log('Novo gestor (simulação):', form);
    setForm(VAZIO);
    setSucesso(true);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Recursos Humanos" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
            <Text style={s.voltarTexto}>Voltar</Text>
          </Pressable>

          <Text style={s.titulo}>Cadastrar gestor</Text>
          <Text style={s.subtitulo}>
            Ao salvar, o sistema cria a jornada de 30 dias de onboarding e notifica o colaborador e gestor relacionado.
          </Text>

          <View style={s.form}>
            <Campo label="Nome completo" erro={erros.nome}>
              <TextInput
                style={formStyles.input}
                placeholder="Ex.: João Vitor Nogueira"
                placeholderTextColor={PLACEHOLDER}
                value={form.nome}
                onChangeText={(t) => alterar('nome', t)}
                autoCapitalize="words"
              />
            </Campo>

            <Campo label="E-mail" erro={erros.email}>
              <TextInput
                style={formStyles.input}
                placeholder="Ex.: joao.nogueira@gmail.com"
                placeholderTextColor={PLACEHOLDER}
                value={form.email}
                onChangeText={(t) => alterar('email', t)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </Campo>

            <Campo label="Telefone" erro={erros.telefone}>
              <TextInput
                style={formStyles.input}
                placeholder="(11) 93705-7641"
                placeholderTextColor={PLACEHOLDER}
                value={form.telefone}
                onChangeText={(t) => alterar('telefone', formatarTelefone(t))}
                keyboardType="phone-pad"
              />
            </Campo>

            <Campo label="Cargo" erro={erros.cargo}>
              <TextInput
                style={formStyles.input}
                placeholder="Ex.: Gestor em tecnologia"
                placeholderTextColor={PLACEHOLDER}
                value={form.cargo}
                onChangeText={(t) => alterar('cargo', t)}
                autoCapitalize="sentences"
              />
            </Campo>
          </View>


          <Pressable style={s.botao} onPress={cadastrar}>
            <MaterialCommunityIcons name="account-plus-outline" size={22} color="#fff" />
            <Text style={s.botaoTexto}>Cadastrar novo gestor</Text>
          </Pressable>
        </ScrollView>
        <SuccessBanner
          visible={sucesso}
          titulo="Novo gestor registrado!"
          mensagem="Esperando validação da conta via e-mail ou WhatsApp."
          nota="(simulação: ainda não salvo)"
          onClose={() => setSucesso(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },

  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  voltarTexto: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },

  titulo: { marginTop: 36, fontSize: 32, fontWeight: '800', color: '#111', lineHeight: 38 },
  subtitulo: { marginTop: 10, fontSize: 14, color: '#222', lineHeight: 20 },

  form: { marginTop: 32, gap: 16 },


  botao: { marginTop: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 44, borderRadius: 6, backgroundColor: '#25626B' },
  botaoTexto: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
