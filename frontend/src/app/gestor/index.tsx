import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { primeiroNomeDe, useAuth } from '@/context/auth-context';

/* ------------------------------------------------------------------ */
/* Dados de exemplo — troque por chamadas à API quando o backend vier  */
/* ------------------------------------------------------------------ */
type Status = 'atrasado' | 'andamento';

const STATUS: Record<Status, { label: string; cor: string }> = {
  atrasado: { label: 'Atrasado', cor: '#B79A9C' },
  andamento: { label: 'Em andamento', cor: '#8F95B4' },
};

const EQUIPE: {
  nome: string;
  cargo: string;
  inicio: string;
  progresso: number;
  pendencias: number;
  status: Status;
}[] = [
  { nome: 'Anne Carlini', cargo: 'Product Manager', inicio: '01/09/2026', progresso: 50, pendencias: 10, status: 'atrasado' },
  { nome: 'Anne Carlini', cargo: 'Product Manager', inicio: '01/09/2026', progresso: 50, pendencias: 10, status: 'andamento' },
];

const ATENCAO: { nome: string; cargo: string; data: string; pendencia: 'assinatura' | 'feedback' }[] = [
  { nome: 'Anne Carlini', cargo: 'Product Manager', data: '01/09/2026', pendencia: 'assinatura' },
  { nome: 'Matheus Silva Santos', cargo: 'Desenvolvedor', data: '10/09/2026', pendencia: 'feedback' },
];

const PENDENCIA = {
  assinatura: { label: 'Pendente assinatura', icon: 'square-edit-outline' },
  feedback: { label: 'Pendente feedback', icon: 'format-quote-close' },
} as const;

/* ------------------------------------------------------------------ */

export default function HomeGestor() {
  const { user } = useAuth();
  const primeiroNome = primeiroNomeDe(user?.nome);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Gestor" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Boas-vindas */}
        <Text style={s.titulo}>
          Bem vindo,{'\n'}
          {primeiroNome}!
        </Text>
        <Text style={s.subtitulo}>
          Acompanhe a jornada de onboarding dos novos colaboradores, em tempo real e sem burocracias.
        </Text>

        <View style={s.cards}>
          {/* Minha equipe */}
          <Card>
            <CardCabecalho titulo="Minha Equipe" />

            {EQUIPE.map((m, i) => (
              <View key={`${m.nome}-${i}`} style={[s.item, i < EQUIPE.length - 1 && s.itemDivisor]}>
                <Text style={s.nome}>{m.nome}</Text>
                <Text style={s.miudo}>
                  {m.cargo} • Início {m.inicio}
                </Text>

                <View style={s.progressoLinha}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar percent={m.progresso} height={7} />
                  </View>
                  <Text style={s.percentual}>{m.progresso}%</Text>
                </View>

                <View style={s.pilulas}>
                  <View style={[s.pilula, { backgroundColor: '#9DB9BD' }]}>
                    <Text style={s.pilulaTexto}>{m.pendencias} pendências</Text>
                  </View>
                  <View style={[s.pilula, { backgroundColor: STATUS[m.status].cor }]}>
                    <Text style={s.pilulaTexto}>{STATUS[m.status].label}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>

          {/* Precisa da sua atenção */}
          <Card>
            <CardCabecalho titulo="Precisa da sua atenção" />

            {ATENCAO.map((a, i) => {
              const p = PENDENCIA[a.pendencia];
              return (
                <View key={`${a.nome}-${i}`} style={[s.atencaoLinha, i < ATENCAO.length - 1 && s.itemDivisor]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.nome}>{a.nome}</Text>
                    <Text style={s.miudo}>
                      {a.cargo} • {a.data}
                    </Text>
                  </View>

                  <Pressable style={s.pilulaEscura} onPress={() => {}}>
                    <Text style={s.pilulaEscuraTexto}>{p.label}</Text>
                    <MaterialCommunityIcons name={p.icon} size={13} color="#fff" />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CardCabecalho({ titulo }: { titulo: string }) {
  return (
    <View style={s.cabecalho}>
      <Text style={s.cardTitulo}>{titulo}</Text>
      <Pressable onPress={() => {}} hitSlop={8}>
        <Text style={s.verTudo}>Ver tudo</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 48 },

  titulo: { fontSize: 32, fontWeight: '800', color: '#111', lineHeight: 38 },
  subtitulo: { marginTop: 12, fontSize: 14, color: '#222', lineHeight: 20 },

  cards: { marginTop: 28, gap: 16 },

  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#A9A9A9' },
  cardTitulo: { fontSize: 16, fontWeight: '800', color: '#111' },
  verTudo: { fontSize: 11, color: '#111' },

  item: { paddingVertical: 12 },
  itemDivisor: { borderBottomWidth: 1, borderBottomColor: '#C4C4C4' },
  nome: { fontSize: 13, fontWeight: '800', color: '#111' },
  miudo: { marginTop: 2, fontSize: 9, color: '#444' },

  progressoLinha: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  percentual: { fontSize: 9, color: '#111' },

  pilulas: { marginTop: 12, flexDirection: 'row', gap: 14 },
  pilula: { flex: 1, maxWidth: 140, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pilulaTexto: { fontSize: 11, color: '#222' },

  atencaoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  pilulaEscura: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 140, height: 24, paddingHorizontal: 10, borderRadius: 4, backgroundColor: '#5B7F85' },
  pilulaEscuraTexto: { fontSize: 10, color: '#fff' },
});
