import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/card';
import { Grade } from '@/components/grade';
import { ProgressBar } from '@/components/progress-bar';
import { useAcompanhamento } from '@/data/data-context';
import { formatarData, ROTULO_FILTRO_JORNADA, STATUS_JORNADA } from '@/data/format';
import type { ItemAcompanhamento } from '@/data/queries';
import type { FiltroJornada } from '@/data/types';
import { useResponsivo } from '@/hooks/use-responsivo';

/*
 * Acompanhamento dos novos colaboradores (RH).
 *   /rh/colaboradores                    -> todos
 *   /rh/colaboradores?status=atrasadas   -> filtrado (em_onboarding | concluidas | atrasadas)
 */

const FILTROS = Object.keys(ROTULO_FILTRO_JORNADA) as FiltroJornada[];

export default function AcompanhamentoColaboradores() {
  const r = useResponsivo();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const filtro = FILTROS.find((f) => f === params.status);
  const itens = useAcompanhamento(filtro);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/rh' as Href);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Recursos Humanos" />

      <ScrollView contentContainerStyle={[s.content, r.conteudo]} showsVerticalScrollIndicator={false}>
        <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
          <Text style={s.voltarTexto}>Voltar</Text>
        </Pressable>

        <Text style={s.titulo}>Acompanhamento dos novos colaboradores</Text>
        <Text style={s.subtitulo}>Resumo do processo de onboarding por colaborador</Text>

        {/* Mostra qual filtro está ativo (vindo dos cartões da home) */}
        {filtro && (
          <View style={s.filtro}>
            <Text style={s.filtroTexto}>Mostrando: {ROTULO_FILTRO_JORNADA[filtro]}</Text>
            <Pressable onPress={() => router.setParams({ status: '' })} hitSlop={8}>
              <Text style={s.filtroLimpar}>Ver todos</Text>
            </Pressable>
          </View>
        )}

        {r.largo ? (
          <>
            {itens.length === 0 && (
              <Card style={{ marginTop: 20 }}>
                <Text style={s.vazio}>Nenhum colaborador encontrado.</Text>
              </Card>
            )}
            <Grade colunas={r.colunas(3)} esticar style={{ marginTop: 20 }}>
              {itens.map((c) => (
                <Card key={c.id}>
                  <DadosColaborador c={c} />
                </Card>
              ))}
            </Grade>
          </>
        ) : (
          <Card style={{ marginTop: 20 }}>
            {itens.length === 0 && <Text style={s.vazio}>Nenhum colaborador encontrado.</Text>}

            {itens.map((c, i) => (
              <View key={c.id} style={[s.item, i < itens.length - 1 && s.itemDivisor]}>
                <DadosColaborador c={c} />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Dados de um colaborador (no celular, um item da lista; em telas largas, um cartão)
function DadosColaborador({ c }: { c: ItemAcompanhamento }) {
  return (
    <>
      <Text style={s.nome}>{c.nome}</Text>
      <Text style={s.texto}>{c.cargo}</Text>
      <Text style={s.texto}>
        Período de acompanhamento: {formatarData(c.dataInicio)} até {formatarData(c.dataFim)}
      </Text>

      <View style={{ marginTop: 8 }}>
        <ProgressBar percent={c.percentual} height={7} />
      </View>
      <Text style={[s.texto, { marginTop: 6 }]}>
        {c.concluidas} de {c.total} atividades concluídas
      </Text>

      <View style={[s.pilula, { backgroundColor: STATUS_JORNADA[c.status].cor }]}>
        <Text style={s.pilulaTexto}>{STATUS_JORNADA[c.status].label}</Text>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 48 },

  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  voltarTexto: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },

  titulo: { marginTop: 16, fontSize: 30, fontWeight: '800', color: '#111', lineHeight: 36 },
  subtitulo: { marginTop: 12, fontSize: 14, color: '#222', lineHeight: 20 },

  filtro: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  filtroTexto: { fontSize: 12, color: '#25626B', fontWeight: '800' },
  filtroLimpar: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },

  vazio: { fontSize: 13, color: '#444' },

  item: { paddingVertical: 12 },
  itemDivisor: { borderBottomWidth: 1, borderBottomColor: '#A9A9A9' },
  nome: { fontSize: 13, fontWeight: '800', color: '#111' },
  texto: { marginTop: 2, fontSize: 12, color: '#222' },

  pilula: { alignSelf: 'flex-start', marginTop: 10, minWidth: 116, height: 20, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  pilulaTexto: { fontSize: 10, color: '#222' },
});