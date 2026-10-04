import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/* ------------------------------------------------------------------ */
/* Dados de exemplo — troque por chamadas à API quando o backend vier  */
/* ------------------------------------------------------------------ */
const STATS: { icon: IconName; valor: number; label: string }[] = [
  { icon: 'account-outline', valor: 10, label: 'Colaboradores em onboarding' },
  { icon: 'check-all', valor: 10, label: 'Jornadas concluídas' },
  { icon: 'alert-outline', valor: 10, label: 'Jornadas atrasadas' },
  { icon: 'percent', valor: 10, label: 'Painel de Gestores' },
];

const ASSINATURAS = [
  { nome: 'Anne Carlini de Oliveira', status: 'Assinaturas pendentes' },
  { nome: 'Matheus Silva Santos', status: 'Assinaturas pendentes' },
];
const JORNADAS_ATENCAO = 2;

const EVENTOS = [
  { texto: 'Lembrete automático enviado para 4 colaboradores com prazo em 2 dias.', data: '10/04/2026' },
  { texto: 'Alerta de atraso de assinatura de documento enviado ao gestor João Nogueira.', data: '10/04/2026' },
];

const GESTORES = [
  { nome: 'João Vitor Nogueira', area: 'Tecnologia', total: '12 colaboradores' },
  { nome: 'Carlos Meneses', area: 'Operações', total: '3 colaboradores' },
  { nome: 'João Vitor Nogueira', area: 'Tecnologia', total: '12 colaboradores' },
];

/* ------------------------------------------------------------------ */

export default function HomeRH() {
  const { user, logout } = useAuth();
  const primeiroNome = user?.nome.split(' ')[0] ?? '';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Cabeçalho */}
      <View style={s.header}>
        <Pressable accessibilityLabel="Abrir menu" hitSlop={8} onPress={() => {}}>
          <MaterialCommunityIcons name="menu" size={28} color={TEAL} />
        </Pressable>

        <View style={s.logo}>
          <Text style={s.logoText}>OJ</Text>
        </View>

        {/* Provisório: tocar em "Perfil RH" faz logout, para facilitar os testes */}
        <Pressable onPress={logout} style={s.perfil} accessibilityLabel="Perfil RH. Tocar para sair">
          <Text style={s.perfilLabel}>Perfil</Text>
          <Text style={s.perfilNome}>RH</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Boas-vindas */}
        <Text style={s.titulo}>
          Bem vindo,{'\n'}
          {primeiroNome}!
        </Text>
        <Text style={s.subtitulo}>
          Acompanhe a jornada de onboarding dos novos colaboradores, em tempo real e sem burocracias.
        </Text>

        {/* Ações principais */}
        <View style={s.acoes}>
          <Pressable style={s.botao} onPress={() => {}}>
            <MaterialCommunityIcons name="account-plus-outline" size={20} color="#fff" />
            <Text style={s.botaoTexto}>Cadastrar novo colaborador</Text>
          </Pressable>
          <Pressable style={s.botao} onPress={() => {}}>
            <MaterialCommunityIcons name="account-plus-outline" size={20} color="#fff" />
            <Text style={s.botaoTexto}>Cadastrar novo Gestor</Text>
          </Pressable>
        </View>

        {/* Indicadores */}
        <View style={s.grid}>
          {STATS.map((item) => (
            <View key={item.label} style={s.stat}>
              <View style={s.statTile}>
                <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
              </View>
              <Text style={s.statValor}>{item.valor}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Divider spaced />

        {/* Assinaturas pendentes */}
        <Card>
          <Text style={s.cardTitulo}>Assinaturas pendentes</Text>
          {ASSINATURAS.map((a) => (
            <View key={a.nome} style={s.linha}>
              <Text style={s.nome}>{a.nome}</Text>
              <Text style={s.detalhe}>{a.status}</Text>
            </View>
          ))}

          <View style={s.alerta}>
            <MaterialCommunityIcons name="check-all" size={18} color={TEAL_ESCURO} />
            <Text style={s.alertaTexto}>{JORNADAS_ATENCAO} jornada(s) precisam de atenção</Text>
            <Pressable onPress={() => {}}>
              <Text style={s.verTudo}>Ver tudo</Text>
            </Pressable>
          </View>
        </Card>

        <Divider spaced />

        {/* Eventos automáticos */}
        <Card>
          <View style={s.cardCabecalho}>
            <MaterialCommunityIcons name="flash-outline" size={20} color={TEAL} />
            <Text style={s.cardTitulo}>Eventos automáticos recentes</Text>
          </View>
          {EVENTOS.map((e) => (
            <View key={e.texto} style={s.linha}>
              <Text style={s.detalheEscuro}>{e.texto}</Text>
              <Text style={s.data}>{e.data}</Text>
            </View>
          ))}
        </Card>

        <Divider spaced />

        {/* Resumo por gestor */}
        <Card>
          <View style={s.cardCabecalho}>
            <MaterialCommunityIcons name="chart-bar" size={20} color={TEAL} />
            <Text style={[s.cardTitulo, { flex: 1 }]}>Resumo por gestor</Text>
            <Pressable onPress={() => {}}>
              <Text style={s.verTudo}>Ver tudo</Text>
            </Pressable>
          </View>
          {GESTORES.map((g, i) => (
            <View key={`${g.nome}-${i}`} style={s.linha}>
              <Text style={s.nome}>{g.nome}</Text>
              <Text style={s.detalheEscuro}>{g.area}</Text>
              <Text style={s.data}>{g.total}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

function Divider({ spaced }: { spaced?: boolean }) {
  return <View style={[s.divisor, spaced && { marginVertical: 18 }]} />;
}

/* ------------------------------------------------------------------ */

const TEAL = '#3B8D9C';
const TEAL_ESCURO = '#25626B';
const SUPERFICIE = '#D9D9D9';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#E2E2E2' },
  logo: { position: 'absolute', left: 52, width: 32, height: 32, borderRadius: 16, backgroundColor: '#4AA3B3', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 11, fontWeight: '500' },
  perfil: { alignItems: 'flex-end' },
  perfilLabel: { fontSize: 11, color: '#222' },
  perfilNome: { fontSize: 13, fontWeight: '800', color: '#111' },

  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 48 },

  titulo: { fontSize: 32, fontWeight: '800', color: '#111', lineHeight: 38 },
  subtitulo: { marginTop: 12, fontSize: 13, color: '#222', lineHeight: 18 },

  acoes: { marginTop: 20, gap: 10 },
  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 6, backgroundColor: TEAL_ESCURO },
  botaoTexto: { color: '#fff', fontSize: 14, fontWeight: '500' },

  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '48%', flexGrow: 1, minHeight: 112, borderRadius: 12, backgroundColor: SUPERFICIE, overflow: 'hidden', padding: 12, paddingTop: 48 },
  statTile: { position: 'absolute', top: 0, left: 0, width: 48, height: 40, borderBottomRightRadius: 14, backgroundColor: TEAL_ESCURO, alignItems: 'center', justifyContent: 'center' },
  statValor: { position: 'absolute', top: 8, right: 14, fontSize: 24, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 14, fontWeight: '800', color: '#111', lineHeight: 18 },

  divisor: { height: 1, backgroundColor: '#BDBDBD' },

  card: { borderRadius: 12, backgroundColor: SUPERFICIE, padding: 16 },
  cardCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitulo: { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 2 },

  linha: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#B3B3B3' },
  nome: { fontSize: 13, fontWeight: '800', color: '#111' },
  detalhe: { fontSize: 12, color: '#555', marginTop: 2 },
  detalheEscuro: { fontSize: 12, color: '#333', marginTop: 2 },
  data: { fontSize: 10, color: '#666', marginTop: 2 },

  alerta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: '#9DBDC4' },
  alertaTexto: { flex: 1, fontSize: 12, color: '#111' },
  verTudo: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },
});
