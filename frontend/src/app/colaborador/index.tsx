import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { primeiroNomeDe, useAuth } from '@/context/auth-context';

/* ------------------------------------------------------------------ */
/* Dados de exemplo — troque por chamadas à API quando o backend vier  */
/* ------------------------------------------------------------------ */
const PROGRESSO = { concluidas: 10, total: 20 };

// Lista vazia = "Tudo em dia!". Exemplo de item: { titulo: 'Assinar contrato', prazo: '15/09/2026' }
const PROXIMAS_ATIVIDADES: { titulo: string; prazo: string }[] = [];

const FEEDBACKS = [
  {
    texto: 'Boa evolução técnica, está se ambientando no ambiente de trabalho e se aprofundando nas ferramentas internas.',
    autor: 'João Vitor Nogueira',
    data: '11/09/2026',
  },
];

/* ------------------------------------------------------------------ */

export default function HomeColaborador() {
  const { user } = useAuth();
  const primeiroNome = primeiroNomeDe(user?.nome);
  const percentual = Math.round((PROGRESSO.concluidas / PROGRESSO.total) * 100);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Colaborador" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Boas-vindas */}
        <Text style={s.titulo}>
          Bem vinda,{'\n'}
          {primeiroNome}!
        </Text>
        <Text style={s.subtitulo}>
          Aqui você pode acompanhar sua jornada de onboarding e em casos de dúvida, nosso suporte está disponível em
          horário comercial.
        </Text>

        <View style={s.cards}>
          {/* Progresso */}
          <Card>
            <Text style={s.cardTitulo}>Seu progresso</Text>
            <View style={{ marginTop: 10 }}>
              <ProgressBar percent={percentual} />
            </View>
            <Text style={s.miudo}>
              {PROGRESSO.concluidas} de {PROGRESSO.total} atividades concluídas
            </Text>
          </Card>

          {/* Próximas atividades */}
          <Card>
            <Text style={s.cardTitulo}>Próximas atividades</Text>

            {PROXIMAS_ATIVIDADES.length === 0 ? (
              <Text style={s.miudo}>Tudo em dia! Parabéns!</Text>
            ) : (
              PROXIMAS_ATIVIDADES.map((a) => (
                <View key={a.titulo} style={s.linha}>
                  <Text style={s.nome}>{a.titulo}</Text>
                  <Text style={s.miudo}>Prazo: {a.prazo}</Text>
                </View>
              ))
            )}

            <Pressable style={s.botao} onPress={() => {}}>
              <Text style={s.botaoTexto}>Continuar jornada</Text>
            </Pressable>
          </Card>

          {/* Feedbacks */}
          <Card>
            <Text style={s.cardTitulo}>Feedbacks recebidos</Text>
            {FEEDBACKS.map((f) => (
              <View key={f.texto} style={s.feedback}>
                <Text style={s.feedbackTexto}>{f.texto}</Text>
                <Text style={s.feedbackAutor}>
                  {f.autor} • {f.data}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 48 },

  titulo: { fontSize: 32, fontWeight: '800', color: '#111', lineHeight: 38 },
  subtitulo: { marginTop: 12, fontSize: 14, color: '#222', lineHeight: 20 },

  cards: { marginTop: 28, gap: 16 },
  cardTitulo: { fontSize: 16, fontWeight: '800', color: '#111' },
  miudo: { marginTop: 6, fontSize: 11, color: '#333' },

  linha: { marginTop: 10 },
  nome: { fontSize: 13, fontWeight: '800', color: '#111' },

  botao: { marginTop: 16, marginHorizontal: 12, height: 38, borderRadius: 6, backgroundColor: '#25626B', alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#fff', fontSize: 14, fontWeight: '500' },

  feedback: { marginTop: 14, marginHorizontal: 8, padding: 12, borderRadius: 6, backgroundColor: '#9DB9BD' },
  feedbackTexto: { fontSize: 11, color: '#111', lineHeight: 15 },
  feedbackAutor: { marginTop: 6, fontSize: 8, color: '#444' },
});
