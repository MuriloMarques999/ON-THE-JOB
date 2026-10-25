import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/card';
import { useEquipe } from '@/data/data-context';
import { STATUS_ATIVIDADE, textoPrazo } from '@/data/format';
import type { StatusJornada } from '@/data/types';

/*
 * Acompanhamento da jornada de onboarding (Gestor): só os colaboradores que ele gerencia.
 * Ordem: quem precisa de mais atenção primeiro. O dropdown filtra por status e cada colaborador
 * pode ser expandido para ver, de forma breve, as atividades que ainda não concluiu.
 *
 * Os status da jornada e das atividades usam os mesmos nomes e cores (STATUS_ATIVIDADE).
 */

const STATUS_ORDEM: StatusJornada[] = ['concluida', 'em_andamento', 'pendente', 'atrasada'];

export default function AcompanhamentoEquipe() {
  const router = useRouter();
  const [filtro, setFiltro] = useState<StatusJornada | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const { hoje, itens } = useEquipe(filtro ?? undefined);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/gestor' as Href);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Gestor" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
          <Text style={s.voltarTexto}>Voltar</Text>
        </Pressable>

        <Text style={s.titulo}>
          Acompanhe a jornada de onboarding dos novos colaboradores atrelados a sua gestão.
        </Text>

        {/* Filtro por status */}
        <Pressable style={s.filtro} onPress={() => setMenuAberto((v) => !v)} accessibilityRole="button">
          <Text style={s.filtroTexto}>{filtro ? STATUS_ATIVIDADE[filtro].label : 'Todos os status'}</Text>
          <MaterialCommunityIcons name={menuAberto ? 'chevron-up' : 'chevron-down'} size={22} color="#25626B" />
        </Pressable>

        {menuAberto && (
          <View style={s.menu}>
            <Opcao rotulo="Todos os status" ativo={filtro === null} onPress={() => { setFiltro(null); setMenuAberto(false); }} />
            {STATUS_ORDEM.map((st) => (
              <Opcao
                key={st}
                rotulo={STATUS_ATIVIDADE[st].label}
                cor={STATUS_ATIVIDADE[st].cor}
                ativo={filtro === st}
                onPress={() => { setFiltro(st); setMenuAberto(false); }}
              />
            ))}
          </View>
        )}

        {itens.length === 0 && <Text style={s.vazio}>Nenhum colaborador encontrado.</Text>}

        <View style={s.lista}>
          {itens.map((c) => {
            const st = STATUS_ATIVIDADE[c.status];
            const aberto = !!expandidos[c.id];
            const restantes = c.totalPendentes - c.atividadesPendentes.length;

            return (
              <Card key={c.id} style={s.cartao}>
                <Text style={s.nome}>{c.nome}</Text>

                <View style={s.linha}>
                  <Text style={s.cargo}>{c.cargo}</Text>
                  <View style={[s.pilula, { backgroundColor: st.cor }]}>
                    <Text style={s.pilulaTexto}>{st.label}</Text>
                  </View>
                </View>

                {/* Destaque de prioridade */}
                {c.motivo && (
                  <View style={s.motivoLinha}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#8A2B2B" />
                    <Text style={s.motivo}>{c.motivo}</Text>
                  </View>
                )}

                <Text style={s.progresso}>
                  {c.concluidas} de {c.total} atividades concluídas · {c.percentual}%
                </Text>

                                {/* Jornada concluída: o termo de conclusão ainda espera assinatura */}
                {c.assinaturaPendente && (
                  <Text style={s.assinatura}>
                    {c.assinaturaPendente === 'colaborador' ? 'Aguardando assinatura do colaborador' : 'Aguardando a sua assinatura'}
                  </Text>
                )}

                {/* Atividades que ainda não foram feitas (resumo) */}
                {c.totalPendentes > 0 && (
                  <Pressable
                    style={s.expandir}
                    onPress={() => setExpandidos((e) => ({ ...e, [c.id]: !e[c.id] }))}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: aberto }}>
                    <Text style={s.expandirTexto}>
                      {aberto ? 'Ocultar' : 'Ver'} atividades pendentes ({c.totalPendentes})
                    </Text>
                    <MaterialCommunityIcons name={aberto ? 'chevron-up' : 'chevron-down'} size={20} color="#25626B" />
                  </Pressable>
                )}

                {aberto && (
                  <View style={s.pendentes}>
                    {c.atividadesPendentes.map((a) => (
                      <View key={a.id} style={s.pendente}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pendenteTitulo}>{a.titulo}</Text>
                          <Text style={[s.pendenteSub, a.status === 'atrasada' && { color: '#8A2B2B', fontWeight: '700' }]}>
                            Semana {a.semana} · {textoPrazo(a.prazo, hoje)}
                          </Text>
                        </View>
                        <View style={[s.pilulaMini, { backgroundColor: STATUS_ATIVIDADE[a.status].cor }]}>
                          <Text style={s.pilulaMiniTexto}>{STATUS_ATIVIDADE[a.status].label}</Text>
                        </View>
                      </View>
                    ))}
                    {restantes > 0 && (
                      <Text style={s.mais}>
                        + {restantes} {restantes === 1 ? 'atividade' : 'atividades'}
                      </Text>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Opcao({ rotulo, cor, ativo, onPress }: { rotulo: string; cor?: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable style={s.opcao} onPress={onPress} accessibilityRole="button">
      {cor ? <View style={[s.ponto, { backgroundColor: cor }]} /> : <View style={s.ponto} />}
      <Text style={[s.opcaoTexto, ativo && { fontWeight: '800' }]}>{rotulo}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 48 },

  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  voltarTexto: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },

  titulo: { marginTop: 14, fontSize: 18, fontWeight: '500', color: '#111', lineHeight: 24 },

  filtro: { marginTop: 18, flexDirection: 'row', alignItems: 'center', height: 32, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#D9D9D9' },
  filtroTexto: { flex: 1, fontSize: 11, color: '#333' },
  menu: { marginTop: 4, padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0D0D0', gap: 2 },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 6 },
  opcaoTexto: { fontSize: 11, color: '#333' },
  ponto: { width: 8, height: 8, borderRadius: 4 },

  vazio: { marginTop: 24, fontSize: 12, color: '#444' },
  lista: { marginTop: 18, gap: 14 },

  cartao: { paddingVertical: 16 },
  nome: { fontSize: 16, fontWeight: '800', color: '#111' },
  linha: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cargo: { flex: 1, fontSize: 12, color: '#222' },
  pilula: { width: 110, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  pilulaTexto: { fontSize: 9, color: '#222' },

  motivoLinha: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  motivo: { fontSize: 11, fontWeight: '700', color: '#8A2B2B' },
  progresso: { marginTop: 8, fontSize: 10, color: '#333' },
  assinatura: { marginTop: 6, fontSize: 10, fontWeight: '700', color: '#25626B' },

  expandir: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#B3B3B3' },
  expandirTexto: { fontSize: 11, color: '#25626B', fontWeight: '700' },

  pendentes: { marginTop: 6, gap: 8 },
  pendente: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: '#EDEDED' },
  pendenteTitulo: { fontSize: 11, fontWeight: '700', color: '#111' },
  pendenteSub: { marginTop: 2, fontSize: 9, color: '#444' },
  pilulaMini: { minWidth: 70, height: 14, paddingHorizontal: 6, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  pilulaMiniTexto: { fontSize: 8, color: '#222' },
  mais: { fontSize: 10, color: '#444', textAlign: 'center' },
});