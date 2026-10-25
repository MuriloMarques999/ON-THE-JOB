import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/card';
import { primeiroNomeDe, useAuth } from '@/context/auth-context';
import { useHomeRH } from '@/data/data-context';
import { formatarData } from '@/data/format';
import type { HomeRH } from '@/data/queries';
import type { FiltroJornada } from '@/data/types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Quais números aparecem nos cartões (os valores vêm da camada de dados)
const INDICADORES: { chave: keyof HomeRH['contagens']; icon: IconName; label: string; filtro?: FiltroJornada; rota?: string }[] = [
  { chave: 'emOnboarding', icon: 'account-outline', label: 'Colaboradores em onboarding', filtro: 'em_onboarding' },
  { chave: 'concluidas', icon: 'check-all', label: 'Jornadas concluídas', filtro: 'concluidas' },
  { chave: 'atrasadas', icon: 'alert-outline', label: 'Jornadas atrasadas', filtro: 'atrasadas' },
  { chave: 'gestores', icon: 'percent', label: 'Painel de Gestores', rota: '/rh/gestores' },
];

export default function HomeRH() {
  const { user } = useAuth();
  const router = useRouter();
  const home = useHomeRH();
  const primeiroNome = primeiroNomeDe(user?.nome);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="RH" />

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
          <Pressable style={s.botao} onPress={() => router.push('/rh/cadastrar-colaborador' as Href)}>
            <MaterialCommunityIcons name="account-plus-outline" size={20} color="#fff" />
            <Text style={s.botaoTexto}>Cadastrar novo colaborador</Text>
          </Pressable>
          <Pressable style={s.botao} onPress={() => router.push('/rh/cadastrar-gestor' as Href)}>
            <MaterialCommunityIcons name="account-plus-outline" size={20} color="#fff" />
            <Text style={s.botaoTexto}>Cadastrar novo Gestor</Text>
          </Pressable>
        </View>

        {/* Indicadores */}
        <View style={s.grid}>
          {INDICADORES.map((item) => (
            <Pressable
              key={item.chave}
              style={s.stat}
              accessibilityRole="button"
              onPress={() =>
                item.rota
                  ? router.push(item.rota as Href)
                  : router.push({ pathname: '/rh/colaboradores', params: { status: item.filtro } } as Href)
              }>
              <View style={s.statTile}>
                <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
              </View>
              <Text style={s.statValor}>{home.contagens[item.chave]}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Divider />

        {/* Assinaturas pendentes */}
        <Card>
          <Text style={s.cardTitulo}>Assinaturas pendentes</Text>

          {home.assinaturasPendentes.length === 0 && <Text style={s.detalhe}>Nenhuma assinatura pendente.</Text>}

          {home.assinaturasPendentes.map((a) => (
            <View key={a.id} style={s.linha}>
              <Text style={s.nome}>{a.nome}</Text>
              <Text style={s.detalhe}>Assinaturas pendentes</Text>
            </View>
          ))}

          {home.jornadasAtencao > 0 && (
            <View style={s.alerta}>
              <MaterialCommunityIcons name="check-all" size={18} color="#25626B" />
              <Text style={s.alertaTexto}>{home.jornadasAtencao} jornada(s) precisam de atenção</Text>
              <Pressable onPress={() => router.push('/rh/assinaturas' as Href)}>
                <Text style={s.verTudo}>Ver tudo</Text>
              </Pressable>
            </View>
          )}
        </Card>

        <Divider />

        {/* Eventos automáticos */}
        <Card>
          <View style={s.cardCabecalho}>
            <MaterialCommunityIcons name="flash-outline" size={20} color="#3B8D9C" />
            <Text style={s.cardTitulo}>Eventos automáticos recentes</Text>
          </View>
          {home.eventos.map((e) => (
            <View key={e.id} style={s.linha}>
              <Text style={s.detalheEscuro}>{e.texto}</Text>
              <Text style={s.data}>{formatarData(e.data)}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Divider() {
  return <View style={s.divisor} />;
}

const TEAL_ESCURO = '#25626B';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 48 },

  titulo: { fontSize: 32, fontWeight: '800', color: '#111', lineHeight: 38 },
  subtitulo: { marginTop: 12, fontSize: 13, color: '#222', lineHeight: 18 },

  acoes: { marginTop: 20, gap: 10 },
  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 6, backgroundColor: TEAL_ESCURO },
  botaoTexto: { color: '#fff', fontSize: 14, fontWeight: '500' },

  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '48%', flexGrow: 1, minHeight: 112, borderRadius: 12, backgroundColor: '#D9D9D9', overflow: 'hidden', padding: 12, paddingTop: 48 },
  statTile: { position: 'absolute', top: 0, left: 0, width: 48, height: 40, borderBottomRightRadius: 14, backgroundColor: TEAL_ESCURO, alignItems: 'center', justifyContent: 'center' },
  statValor: { position: 'absolute', top: 8, right: 14, fontSize: 24, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 14, fontWeight: '800', color: '#111', lineHeight: 18 },

  divisor: { height: 1, marginVertical: 18, backgroundColor: '#BDBDBD' },

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