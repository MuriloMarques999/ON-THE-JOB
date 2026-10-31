import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/card';
import { Grade } from '@/components/grade';
import { ProgressBar } from '@/components/progress-bar';
import { primeiroNomeDe, useAuth } from '@/context/auth-context';
import { useHomeGestor } from '@/data/data-context';
import { formatarData, STATUS_JORNADA } from '@/data/format';
import { useResponsivo } from '@/hooks/use-responsivo';

const PENDENCIA = {
  assinatura: { label: 'Pendente assinatura', icon: 'square-edit-outline' },
  feedback: { label: 'Pendente feedback', icon: 'format-quote-close' },
} as const;

export default function HomeGestor() {
  const r = useResponsivo();
  const { user } = useAuth();
  const router = useRouter();
  const home = useHomeGestor();
  const primeiroNome = primeiroNomeDe(user?.nome);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Gestor" />

      <ScrollView contentContainerStyle={[s.content, r.conteudo]} showsVerticalScrollIndicator={false}>
        {/* Boas-vindas */}
        <Text style={s.titulo}>
          Bem vindo,{'\n'}
          {primeiroNome}!
        </Text>
        <Text style={s.subtitulo}>
          Acompanhe a jornada de onboarding dos novos colaboradores, em tempo real e sem burocracias.
        </Text>

        <Grade colunas={r.colunas(2)} esticar={r.largo} style={s.cards}>
          {/* Minha equipe */}
          <Card>
            <CardCabecalho titulo="Minha Equipe" onVerTudo={() => router.push('/gestor/equipe' as Href)} />

            {home.equipe.length === 0 && <Text style={s.vazio}>Nenhum colaborador vinculado a você.</Text>}

            {home.equipe.map((m, i) => (
              <View key={m.id} style={[s.item, i < home.equipe.length - 1 && s.itemDivisor]}>
                <Text style={s.nome}>{m.nome}</Text>
                {/* Destaque: por que este colaborador está entre os de maior prioridade */}
                {m.motivo && (
                  <View style={s.motivoLinha}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#8A2B2B" />
                    <Text style={s.motivo}>{m.motivo}</Text>
                  </View>
                )}
                <Text style={s.miudo}>
                  {m.cargo} • Início {formatarData(m.dataInicio)}
                </Text>

                <View style={s.progressoLinha}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar percent={m.percentual} height={7} />
                  </View>
                  <Text style={s.percentual}>{m.percentual}%</Text>
                </View>

                <View style={s.pilulas}>
                  <View style={[s.pilula, { backgroundColor: '#9DB9BD' }]}>
                    <Text style={s.pilulaTexto}>
                      {m.pendencias} {m.pendencias === 1 ? 'pendência' : 'pendências'}
                    </Text>
                  </View>
                  <View style={[s.pilula, { backgroundColor: STATUS_JORNADA[m.status].cor }]}>
                    <Text style={s.pilulaTexto}>{STATUS_JORNADA[m.status].label}</Text>
                  </View>
                </View>
              </View>
            ))}

            {home.totalEquipe > home.equipe.length && (
              <Text style={s.resumoEquipe}>
                Mostrando os {home.equipe.length} de maior prioridade, de {home.totalEquipe} colaboradores.
              </Text>
            )}
          </Card>

          {/* Precisa da sua atenção */}
          <Card>
            <CardCabecalho titulo="Precisa da sua atenção" onVerTudo={() => router.push('/gestor/atencao' as Href)} />

            {home.atencao.length === 0 && <Text style={s.vazio}>Nada pendente por aqui.</Text>}

            {home.atencao.map((a, i) => {
              const p = PENDENCIA[a.tipo];
              return (
                <View key={a.id} style={[s.atencaoLinha, i < home.atencao.length - 1 && s.itemDivisor]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.nome}>{a.nome}</Text>
                    <Text style={s.miudo}>
                      {a.cargo} • {formatarData(a.data)}
                    </Text>
                  </View>

                  <Pressable
                    style={s.pilulaEscura}
                    onPress={() => router.push({ pathname: '/gestor/atencao', params: { item: a.id } } as unknown as Href)}>
                    <Text style={s.pilulaEscuraTexto}>{p.label}</Text>
                    <MaterialCommunityIcons name={p.icon} size={13} color="#fff" />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </Grade>
      </ScrollView>
    </SafeAreaView>
  );
}

function CardCabecalho({ titulo, onVerTudo }: { titulo: string; onVerTudo?: () => void }) {
  return (
    <View style={s.cabecalho}>
      <Text style={s.cardTitulo}>{titulo}</Text>
      <Pressable onPress={onVerTudo ?? (() => {})} hitSlop={8} accessibilityRole="button">
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
  vazio: { marginTop: 12, fontSize: 12, color: '#444' },

  item: { paddingVertical: 12 },
  itemDivisor: { borderBottomWidth: 1, borderBottomColor: '#C4C4C4' },
  nome: { fontSize: 13, fontWeight: '800', color: '#111' },
  miudo: { marginTop: 2, fontSize: 9, color: '#444' },
  motivoLinha: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
  motivo: { fontSize: 10, fontWeight: '700', color: '#8A2B2B' },
  resumoEquipe: { marginTop: 10, fontSize: 9, color: '#444' },

  progressoLinha: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  percentual: { fontSize: 9, color: '#111' },

  pilulas: { marginTop: 12, flexDirection: 'row', gap: 14 },
  pilula: { flex: 1, maxWidth: 140, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pilulaTexto: { fontSize: 11, color: '#222' },

  atencaoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  pilulaEscura: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 140, height: 24, paddingHorizontal: 10, borderRadius: 4, backgroundColor: '#5B7F85' },
  pilulaEscuraTexto: { fontSize: 10, color: '#fff' },
});