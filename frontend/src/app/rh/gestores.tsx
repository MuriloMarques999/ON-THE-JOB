import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { BarraStatus, LegendaStatus } from '@/components/barra-status';
import { Card } from '@/components/card';
import { ProgressBar } from '@/components/progress-bar';
import { usePainelGestores } from '@/data/data-context';
import { STATUS_JORNADA } from '@/data/format';

/*
 * Painel de Gestores (RH): visão geral do onboarding e a situação da equipe de cada gestor.
 *  - Indicadores gerais (colaboradores, progresso médio, atrasados, pendências dos gestores)
 *  - Gráfico da situação de todas as jornadas
 *  - Um card por gestor (quem mais precisa de atenção vem primeiro) com gráfico da equipe,
 *    progresso médio, pendências e a lista da equipe (botão de expandir)
 */

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function PainelGestores() {
  const router = useRouter();
  const { resumo, gestores } = usePainelGestores();
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/rh' as Href);
  }

  const indicadores: { icon: IconName; valor: string; rotulo: string }[] = [
    { icon: 'account-group-outline', valor: String(resumo.colaboradores), rotulo: 'Colaboradores em acompanhamento' },
    { icon: 'chart-line', valor: `${resumo.progressoMedio}%`, rotulo: 'Progresso médio das jornadas' },
    { icon: 'alert-outline', valor: String(resumo.atrasados), rotulo: 'Jornadas atrasadas' },
    { icon: 'clipboard-check-outline', valor: String(resumo.pendencias), rotulo: 'Pendências dos gestores' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Recursos Humanos" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
          <Text style={s.voltarTexto}>Voltar</Text>
        </Pressable>

        <Text style={s.titulo}>Painel de Gestores</Text>
        <Text style={s.subtitulo}>Veja como está o onboarding da equipe de cada gestor e onde é preciso agir.</Text>

        {/* Indicadores gerais */}
        <View style={s.grid}>
          {indicadores.map((i) => (
            <View key={i.rotulo} style={s.stat}>
              <View style={s.statTile}>
                <MaterialCommunityIcons name={i.icon} size={24} color="#fff" />
              </View>
              <Text style={s.statValor}>{i.valor}</Text>
              <Text style={s.statLabel}>{i.rotulo}</Text>
            </View>
          ))}
        </View>

        {/* Gráfico geral */}
        <Card style={s.bloco}>
          <View style={s.blocoCabecalho}>
            <MaterialCommunityIcons name="chart-bar" size={20} color="#3B8D9C" />
            <Text style={s.blocoTitulo}>Situação das jornadas</Text>
          </View>
          <Text style={s.blocoDescricao}>
            {resumo.colaboradores} {resumo.colaboradores === 1 ? 'colaborador' : 'colaboradores'} de {resumo.gestores}{' '}
            {resumo.gestores === 1 ? 'gestor' : 'gestores'}
          </Text>
          <View style={{ marginTop: 14 }}>
            <BarraStatus valores={resumo.porStatus} altura={16} />
          </View>
          <View style={{ marginTop: 12 }}>
            <LegendaStatus valores={resumo.porStatus} />
          </View>
        </Card>

        {/* Um card por gestor */}
        <Text style={s.secao}>Gestores</Text>
        {gestores.length === 0 && <Text style={s.vazio}>Nenhum gestor cadastrado.</Text>}

        <View style={s.lista}>
          {gestores.map((g) => {
            const aberto = !!abertos[g.id];
            const pendencias = g.feedbacksPendentes + g.assinaturasPendentes;

            return (
              <Card key={g.id} style={s.gestor}>
                <View style={s.gestorTopo}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.gestorNome}>{g.nome}</Text>
                    <Text style={s.gestorArea}>{g.area}</Text>
                  </View>
                  <Text style={s.gestorTotal}>
                    {g.total} {g.total === 1 ? 'colaborador' : 'colaboradores'}
                  </Text>
                </View>

                {g.total === 0 ? (
                  <Text style={s.semEquipe}>Este gestor ainda não tem colaboradores vinculados.</Text>
                ) : (
                  <>
                    <View style={{ marginTop: 14 }}>
                      <BarraStatus valores={g.porStatus} />
                    </View>
                    <View style={{ marginTop: 10 }}>
                      <LegendaStatus valores={g.porStatus} mostrarZeros={false} />
                    </View>

                    <View style={s.progressoLinha}>
                      <Text style={s.progressoRotulo}>Progresso médio</Text>
                      <View style={{ flex: 1 }}>
                        <ProgressBar percent={g.progressoMedio} height={7} />
                      </View>
                      <Text style={s.progressoValor}>{g.progressoMedio}%</Text>
                    </View>

                    {/* Onde é preciso agir */}
                    <View style={s.chips}>
                      {g.atrasados > 0 && (
                        <View style={[s.chip, { backgroundColor: STATUS_JORNADA.atrasada.cor }]}>
                          <Text style={s.chipTexto}>
                            {g.atrasados} {g.atrasados === 1 ? 'atrasado' : 'atrasados'}
                          </Text>
                        </View>
                      )}
                      {g.feedbacksPendentes > 0 && (
                        <View style={[s.chip, { backgroundColor: '#9DB9BD' }]}>
                          <Text style={s.chipTexto}>
                            {g.feedbacksPendentes} {g.feedbacksPendentes === 1 ? 'feedback pendente' : 'feedbacks pendentes'}
                          </Text>
                        </View>
                      )}
                      {g.assinaturasPendentes > 0 && (
                        <View style={[s.chip, { backgroundColor: '#9DB9BD' }]}>
                          <Text style={s.chipTexto}>
                            {g.assinaturasPendentes} {g.assinaturasPendentes === 1 ? 'assinatura pendente' : 'assinaturas pendentes'}
                          </Text>
                        </View>
                      )}
                      {g.atrasados === 0 && pendencias === 0 && (
                        <View style={[s.chip, { backgroundColor: STATUS_JORNADA.concluida.cor }]}>
                          <Text style={s.chipTexto}>Tudo em dia</Text>
                        </View>
                      )}
                    </View>

                    {/* Equipe do gestor */}
                    <Pressable
                      style={s.expandir}
                      onPress={() => setAbertos((a) => ({ ...a, [g.id]: !a[g.id] }))}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: aberto }}>
                      <Text style={s.expandirTexto}>{aberto ? 'Ocultar equipe' : 'Ver equipe'}</Text>
                      <MaterialCommunityIcons name={aberto ? 'chevron-up' : 'chevron-down'} size={20} color="#25626B" />
                    </Pressable>

                    {aberto && (
                      <View style={s.equipe}>
                        {g.colaboradores.map((c) => (
                          <View key={c.id} style={s.membro}>
                            <View style={{ flex: 1 }}>
                              <Text style={s.membroNome}>{c.nome}</Text>
                              <Text style={s.membroCargo}>{c.cargo}</Text>
                              <View style={s.membroBarra}>
                                <View style={{ flex: 1 }}>
                                  <ProgressBar percent={c.percentual} height={5} />
                                </View>
                                <Text style={s.membroPercentual}>{c.percentual}%</Text>
                              </View>
                            </View>
                            <View style={[s.pilulaMini, { backgroundColor: STATUS_JORNADA[c.status].cor }]}>
                              <Text style={s.pilulaMiniTexto}>{STATUS_JORNADA[c.status].label}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const TEAL_ESCURO = '#25626B';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 48 },

  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  voltarTexto: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },

  titulo: { marginTop: 16, fontSize: 30, fontWeight: '800', color: '#111', lineHeight: 36 },
  subtitulo: { marginTop: 6, fontSize: 12, color: '#222', lineHeight: 17 },

  // Cartões de indicador: mesmo desenho da home do RH
  grid: { marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '48%', flexGrow: 1, minHeight: 112, borderRadius: 12, backgroundColor: '#D9D9D9', overflow: 'hidden', padding: 12, paddingTop: 48 },
  statTile: { position: 'absolute', top: 0, left: 0, width: 48, height: 40, borderBottomRightRadius: 14, backgroundColor: TEAL_ESCURO, alignItems: 'center', justifyContent: 'center' },
  statValor: { position: 'absolute', top: 8, right: 14, fontSize: 24, fontWeight: '800', color: '#111' },
  statLabel: { fontSize: 13, fontWeight: '800', color: '#111', lineHeight: 17 },

  bloco: { marginTop: 18, padding: 18 },
  blocoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blocoTitulo: { fontSize: 15, fontWeight: '800', color: '#111' },
  blocoDescricao: { marginTop: 4, fontSize: 11, color: '#444' },

  secao: { marginTop: 26, fontSize: 16, fontWeight: '800', color: '#111' },
  vazio: { marginTop: 10, fontSize: 12, color: '#444' },
  lista: { marginTop: 12, gap: 14 },

  gestor: { padding: 16 },
  gestorTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  gestorNome: { fontSize: 15, fontWeight: '800', color: '#111' },
  gestorArea: { marginTop: 2, fontSize: 11, color: '#333' },
  gestorTotal: { fontSize: 10, color: '#444' },
  semEquipe: { marginTop: 12, fontSize: 11, color: '#444' },

  progressoLinha: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressoRotulo: { fontSize: 10, color: '#333' },
  progressoValor: { fontSize: 10, fontWeight: '800', color: '#111' },

  chips: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chipTexto: { fontSize: 10, color: '#222' },

  expandir: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#B3B3B3' },
  expandirTexto: { fontSize: 11, color: TEAL_ESCURO, fontWeight: '700' },

  equipe: { marginTop: 6, gap: 8 },
  membro: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, backgroundColor: '#EDEDED' },
  membroNome: { fontSize: 11, fontWeight: '700', color: '#111' },
  membroCargo: { marginTop: 1, fontSize: 9, color: '#444' },
  membroBarra: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  membroPercentual: { fontSize: 9, color: '#111' },
  pilulaMini: { minWidth: 76, height: 16, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pilulaMiniTexto: { fontSize: 9, color: '#222' },
});