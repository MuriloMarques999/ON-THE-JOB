import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { BotaoComAviso } from '@/components/botao-com-aviso';
import { Card } from '@/components/card';
import { useAcoesAtividade, useAtividades } from '@/data/data-context';
import { formatarDataCurta, STATUS_ATIVIDADE, textoPrazo } from '@/data/format';
import type { ItemAtividade } from '@/data/queries';
import type { StatusAtividade } from '@/data/types';

/*
 * Atividades do colaborador, separadas por semana.
 * O status é calculado pelo sistema (prazo + ações). O colaborador só pode Iniciar e Concluir
 * (a conclusão é definitiva). O dropdown de status serve apenas como FILTRO.
 * No fim, o card "Assinatura digital" libera os documentos quando TODAS as atividades estão concluídas.
 */

const STATUS_ORDEM: StatusAtividade[] = ['concluida', 'em_andamento', 'pendente', 'atrasada'];

export default function Atividades() {
  const router = useRouter();
  const { hoje, semanas, total, concluidas } = useAtividades();
  const todasConcluidas = total > 0 && concluidas === total; // libera a assinatura digital
  const { iniciar, concluir } = useAcoesAtividade();

  const [filtro, setFiltro] = useState<StatusAtividade | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [recolhidas, setRecolhidas] = useState<Record<number, boolean>>({});
  const [erro, setErro] = useState('');

  // Aplica o filtro e descarta semanas sem nenhuma atividade correspondente
  const visiveis = semanas
    .map((sem) => ({ ...sem, filtradas: sem.atividades.filter((a) => !filtro || a.status === filtro) }))
    .filter((sem) => sem.filtradas.length > 0);
  const totalVisiveis = visiveis.reduce((soma, sem) => soma + sem.filtradas.length, 0);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/colaborador' as Href);
  }

  async function agir(acao: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>, id: string) {
    const resultado = await acao(id);
    setErro(resultado.ok ? '' : resultado.error);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Colaborador" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
          <Text style={s.voltarTexto}>Voltar</Text>
        </Pressable>

        <Text style={s.titulo}>Atividades</Text>
        <Text style={s.subtitulo}>{totalVisiveis} atividades visíveis para o seu perfil</Text>

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

        {!!erro && <Text style={s.erro}>{erro}</Text>}

        {visiveis.length === 0 && <Text style={s.vazio}>Nenhuma atividade com este status.</Text>}

        {visiveis.map((sem) => {
          const fechada = !!recolhidas[sem.semana];
          return (
            <View key={sem.semana} style={s.semana}>
              <Pressable
                style={s.semanaCabecalho}
                onPress={() => setRecolhidas((r) => ({ ...r, [sem.semana]: !r[sem.semana] }))}
                accessibilityRole="button"
                accessibilityState={{ expanded: !fechada }}>
                <Text style={s.semanaTitulo}>Semana {sem.semana}</Text>
                <Text style={s.semanaResumo}>
                  {sem.concluidas}/{sem.total}
                  {sem.atrasadas > 0 ? ` · ${sem.atrasadas} ${sem.atrasadas === 1 ? 'atrasada' : 'atrasadas'}` : ''}
                </Text>
                <View style={{ flex: 1 }} />
                <MaterialCommunityIcons name={fechada ? 'chevron-down' : 'chevron-up'} size={24} color="#25626B" />
              </Pressable>

              {!fechada &&
                sem.filtradas.map((a) => (
                  <CartaoAtividade
                    key={a.id}
                    a={a}
                    hoje={hoje}
                    onIniciar={() => agir(iniciar, a.id)}
                    onConcluir={() => agir(concluir, a.id)}
                  />
                ))}
            </View>
          );
        })}

        {/* Assinatura digital: libera os documentos quando TODAS as atividades estão concluídas */}
        <Card style={s.assinatura}>
          <Text style={s.assinaturaTitulo}>Assinatura digital</Text>
          <Text style={s.assinaturaTexto}>
            {todasConcluidas
              ? 'Você completou a jornada de onboarding na empresa.'
              : 'Conclua todas as atividades da jornada para liberar a assinatura digital.'}
          </Text>

          <View style={s.assinaturaAviso}>
            <Text style={s.assinaturaAvisoTexto}>
              {todasConcluidas
                ? 'Documento do acompanhamento por colaborador e gestor está apto para assinatura digital.'
                : 'O documento do acompanhamento ficará disponível para assinatura digital após a conclusão de todas as atividades.'}
            </Text>
          </View>

          <BotaoComAviso
            texto="Documentos"
            habilitado={todasConcluidas}
            aviso="Só será possível acessar os documentos após a conclusão de todas as atividades."
            onPress={() => router.push('/colaborador/documentos' as Href)}
          />
        </Card>
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

function CartaoAtividade({
  a,
  hoje,
  onIniciar,
  onConcluir,
}: {
  a: ItemAtividade;
  hoje: string;
  onIniciar: () => void;
  onConcluir: () => void;
}) {
  const st = STATUS_ATIVIDADE[a.status];

  // O que mostrar abaixo do título: prazo, ou quando fica disponível, ou como foi concluída
  let detalhe = textoPrazo(a.prazo, hoje);
  if (a.status === 'concluida') detalhe = a.comAtraso ? 'Concluída com atraso' : 'Concluída no prazo';
  else if (!a.podeIniciar) detalhe = `Disponível a partir de ${formatarDataCurta(a.inicio)} · ${detalhe}`;

  return (
    <Card style={s.cartao}>
      <Text style={s.cartaoTitulo}>{a.titulo}</Text>

      <View style={s.cartaoLinha}>
        <Text style={s.cartaoSub}>{a.envolvidos}</Text>
        <View style={[s.pilula, { backgroundColor: st.cor }]}>
          <Text style={s.pilulaTexto}>{st.label}</Text>
        </View>
      </View>

      <Text style={[s.prazo, a.status === 'atrasada' && { color: '#8A2B2B', fontWeight: '700' }]}>{detalhe}</Text>

      {a.status === 'pendente' && a.podeIniciar && (
        <Pressable style={s.botao} onPress={onIniciar} accessibilityRole="button">
          <Text style={s.botaoTexto}>Iniciar</Text>
        </Pressable>
      )}
      {(a.status === 'em_andamento' || a.status === 'atrasada') && (
        <Pressable style={s.botao} onPress={onConcluir} accessibilityRole="button">
          <Text style={s.botaoTexto}>Concluir</Text>
        </Pressable>
      )}
    </Card>
  );
}

const TEAL_ESCURO = '#25626B';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 48 },

  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  voltarTexto: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },

  titulo: { marginTop: 16, fontSize: 30, fontWeight: '800', color: '#111', lineHeight: 36 },
  subtitulo: { marginTop: 6, fontSize: 12, color: '#222' },

  filtro: { marginTop: 18, flexDirection: 'row', alignItems: 'center', height: 32, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#D9D9D9' },
  filtroTexto: { flex: 1, fontSize: 11, color: '#333' },
  menu: { marginTop: 4, padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0D0D0', gap: 2 },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 6 },
  opcaoTexto: { fontSize: 11, color: '#333' },
  ponto: { width: 8, height: 8, borderRadius: 4 },

  erro: { marginTop: 12, fontSize: 12, color: '#B3261E' },
  vazio: { marginTop: 24, fontSize: 12, color: '#444' },

  semana: { marginTop: 22, gap: 12 },
  semanaCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  semanaTitulo: { fontSize: 16, fontWeight: '800', color: '#111' },
  semanaResumo: { fontSize: 9, color: '#333' },

  assinatura: { marginTop: 28, padding: 18, gap: 14 },
  assinaturaTitulo: { fontSize: 16, fontWeight: '800', color: '#111' },
  assinaturaTexto: { fontSize: 12, color: '#222', lineHeight: 17 },
  assinaturaAviso: { padding: 14, borderRadius: 8, backgroundColor: '#9DB9BD' },
  assinaturaAvisoTexto: { fontSize: 11, color: '#111', lineHeight: 16 },

  cartao: { paddingVertical: 14, gap: 8 },
  cartaoTitulo: { fontSize: 14, fontWeight: '800', color: '#111' },
  cartaoLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cartaoSub: { flex: 1, fontSize: 10, color: '#333' },
  pilula: { minWidth: 96, height: 16, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pilulaTexto: { fontSize: 9, color: '#222' },
  prazo: { fontSize: 10, color: '#333' },

  botao: { alignSelf: 'flex-start', marginTop: 2, height: 26, paddingHorizontal: 18, borderRadius: 4, backgroundColor: TEAL_ESCURO, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { fontSize: 10, color: '#fff' },
});