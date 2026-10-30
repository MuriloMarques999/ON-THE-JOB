import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AssinaturaTexto } from '@/components/assinatura-texto';
import { BotaoComAviso } from '@/components/botao-com-aviso';
import { Card } from '@/components/card';
import { SuccessBanner } from '@/components/success-banner';
import { useAcoesGestor, useAtencao, useConclusaoGestor } from '@/data/data-context';
import { formatarData } from '@/data/format';
import type { ItemAtencao } from '@/data/queries';
import { abrirPdf } from '@/services/pdf/abrir-pdf';
import { documentoConclusao } from '@/services/pdf/conclusao';

/*
 * "Documentos" do gestor: tudo o que precisa da atenção dele e o histórico do que já foi feito.
 *  - Feedback pendente: escreve o texto e toca em "Enviar" -> sai dos pendentes e vai para o histórico
 *    (o colaborador passa a ver o feedback na home dele).
 *  - Assinatura pendente: mostra a assinatura do colaborador e o botão "Assinar", que abre a tela de assinatura.
 *  - Histórico: feedbacks enviados e documentos já assinados pelos dois.
 * Parâmetros: `item` = card que já abre expandido | `ok=assinado` = acabou de assinar (mostra o aviso).
 */

export default function DocumentosGestor() {
  const router = useRouter();
  const { item, ok } = useLocalSearchParams<{ item?: string; ok?: string }>();
  const { pendentes, historico } = useAtencao();
  const { enviarFeedback } = useAcoesGestor();

  const [abertos, setAbertos] = useState<Record<string, boolean>>(item ? { [item]: true } : {});
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  // Rola até o card recém-assinado (ele fica no Histórico, que está mais abaixo na tela).
  const rolagem = useRef<ScrollView>(null);
  const [yHistorico, setYHistorico] = useState<number | null>(null);
  const [yFoco, setYFoco] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ titulo: string; mensagem: string } | null>(
    ok === 'assinado' ? { titulo: 'Assinatura registrada', mensagem: 'O documento foi assinado por você e pelo colaborador.' } : null
  );

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/gestor' as Href);
  }

  function alternar(id: string) {
    setAbertos((a) => ({ ...a, [id]: !a[id] }));
  }

  async function enviar(c: ItemAtencao) {
    const resultado = await enviarFeedback(c.colaboradorId, textos[c.id] ?? '');
    if (!resultado.ok) {
      setErros((e) => ({ ...e, [c.id]: resultado.error }));
      return;
    }
    setAviso({ titulo: 'Feedback enviado', mensagem: `${c.nome} já pode ver o seu feedback.` });
  }

  // O card assinado agora faz parte do Histórico; quando chega de uma assinatura ele vem primeiro,
  // já aberto (resultado final).
  const foco = ok === 'assinado' ? historico.find((h) => h.id === item) : undefined;
  const lista = foco ? [foco, ...historico.filter((h) => h.id !== foco.id)] : historico;

  useEffect(() => {
    if (yHistorico === null || yFoco === null) return;
    rolagem.current?.scrollTo({ y: Math.max(0, yHistorico + yFoco - 12), animated: true });
  }, [yHistorico, yFoco]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Gestor" />

      <View style={{ flex: 1 }}>
        <ScrollView ref={rolagem} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
            <Text style={s.voltarTexto}>Voltar</Text>
          </Pressable>

          <Text style={s.titulo}>Documentos</Text>
          <Text style={s.subtitulo}>
            Listagem de colaboradores que precisam da sua atenção para retornar feedbacks ou assinatura de documento.
          </Text>

          <Text style={s.secao}>Pendentes ({pendentes.length})</Text>
          {pendentes.length === 0 && <Text style={s.vazio}>Nada pendente por aqui.</Text>}
          <View style={s.lista}>
            {pendentes.map((c) => (
              <Cartao
                key={c.id}
                c={c}
                aberto={!!abertos[c.id]}
                onAlternar={() => alternar(c.id)}
                texto={textos[c.id] ?? ''}
                erro={erros[c.id]}
                onTexto={(t) => {
                  setTextos((x) => ({ ...x, [c.id]: t }));
                  setErros((e) => ({ ...e, [c.id]: '' }));
                }}
                onEnviar={() => enviar(c)}
                onAssinar={() =>
                  router.push({ pathname: '/gestor/assinar-documento', params: { id: c.documentoId } } as unknown as Href)
                }
              />
            ))}
          </View>

          <Text style={s.secao}>Histórico ({lista.length})</Text>
          {lista.length === 0 && <Text style={s.vazio}>Você ainda não enviou feedbacks nem assinou documentos.</Text>}
          <View style={s.lista} onLayout={(e) => setYHistorico(e.nativeEvent.layout.y)}>
            {lista.map((c) => (
              <View key={c.id} onLayout={c.id === foco?.id ? (e) => setYFoco(e.nativeEvent.layout.y) : undefined}>
                <Cartao c={c} aberto={!!abertos[c.id]} onAlternar={() => alternar(c.id)} />
              </View>
            ))}
          </View>
        </ScrollView>

        <SuccessBanner visible={aviso !== null} titulo={aviso?.titulo ?? ''} mensagem={aviso?.mensagem ?? ''} onClose={() => setAviso(null)} />
      </View>
    </SafeAreaView>
  );
}

function Cartao({
  c,
  aberto,
  onAlternar,
  texto,
  erro,
  onTexto,
  onEnviar,
  onAssinar,
}: {
  c: ItemAtencao;
  aberto: boolean;
  onAlternar: () => void;
  texto?: string;
  erro?: string;
  onTexto?: (t: string) => void;
  onEnviar?: () => void;
  onAssinar?: () => void;
}) {
  const etiqueta = c.concluido
    ? { label: c.tipo === 'feedback' ? 'Feedback enviado' : 'Assinado', cor: '#8FB59A' }
    : { label: c.tipo === 'feedback' ? 'Pendente feedback' : 'Pendente assinatura', cor: '#D9DE8F' };

  return (
    <Card style={s.cartao}>
      <Pressable style={s.cabecalho} onPress={onAlternar} accessibilityRole="button" accessibilityState={{ expanded: aberto }}>
        <Text style={s.cartaoTitulo}>Colaborador</Text>
        <View style={[s.etiqueta, { backgroundColor: etiqueta.cor }]}>
          <Text style={s.etiquetaTexto}>{etiqueta.label}</Text>
        </View>
        <MaterialCommunityIcons name={aberto ? 'chevron-up' : 'chevron-down'} size={22} color="#25626B" />
      </Pressable>

      <Text style={[s.info, { marginTop: 10 }]}>{c.nome}</Text>
      <Text style={s.info}>{c.cargo}</Text>
      <Text style={s.info}>
        Período de acompanhamento: {formatarData(c.inicio)} até {formatarData(c.fim)}
      </Text>

      {aberto && c.tipo === 'feedback' && !c.concluido && (
        <View style={s.corpo}>
          <TextInput
            style={s.areaTexto}
            value={texto}
            onChangeText={onTexto}
            placeholder="Digite o feedback para seu novo colaborador aqui..."
            placeholderTextColor="#4F6568"
            multiline
            textAlignVertical="top"
          />
          {!!erro && <Text style={s.erro}>{erro}</Text>}
          <Pressable style={s.botao} onPress={onEnviar} accessibilityRole="button">
            <Text style={s.botaoTexto}>Enviar</Text>
          </Pressable>
        </View>
      )}

      {aberto && c.tipo === 'feedback' && c.concluido && c.feedback && (
        <View style={s.corpo}>
          <View style={s.feedbackEnviado}>
            <Text style={s.feedbackTexto}>{c.feedback.texto}</Text>
          </View>
          <Text style={s.enviadoEm}>Enviado em {formatarData(c.feedback.data)}</Text>
        </View>
      )}

      {aberto && c.tipo === 'assinatura' && (
        <View style={s.corpo}>
          {!!c.documentoTitulo && <Text style={s.documento}>{c.documentoTitulo}</Text>}

          <View style={s.caixaAss}>
            <Text style={s.caixaRotulo}>Assinatura do colaborador</Text>
            {c.assinaturaColaborador && <AssinaturaTexto nome={c.assinaturaColaborador.nome} />}
          </View>

          <View style={s.caixaAss}>
            <Text style={s.caixaRotulo}>Assinatura do gestor</Text>
            {c.assinaturaGestor ? (
              <AssinaturaTexto nome={c.assinaturaGestor.nome} />
            ) : (
              <BotaoComAviso compacto texto="Assinar" icone="square-edit-outline" habilitado onPress={onAssinar ?? (() => {})} />
            )}
          </View>

          {/* Assinado pelos dois: o mesmo PDF que o colaborador abre na tela de Documentos dele */}
          {c.concluido && c.documentoId && <FormularioAssinado documentoId={c.documentoId} />}
        </View>
      )}
    </Card>
  );
}

// "Formulário On The Job" (termo de conclusão com as duas assinaturas), igual à biblioteca do colaborador.
// Os dados só são buscados quando o cartão está aberto.
function FormularioAssinado({ documentoId }: { documentoId: string }) {
  const dados = useConclusaoGestor(documentoId);

  return (
    <View style={s.docLinha}>
      <MaterialCommunityIcons name="file-document-outline" size={20} color="#3B8D9C" />
      <View style={{ flex: 1 }}>
        <Text style={s.docNome}>Formulário On The Job</Text>
        <Text style={s.docSub}>Institucional • PDF</Text>
      </View>
      <Pressable
        onPress={() => dados && abrirPdf(documentoConclusao(dados))}
        disabled={!dados}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Abrir Formulário On The Job">
        <Text style={[s.abrir, !dados && { color: '#888' }]}>{dados ? 'Abrir' : 'Carregando...'}</Text>
      </Pressable>
    </View>
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

  secao: { marginTop: 26, fontSize: 14, fontWeight: '800', color: '#111' },
  vazio: { marginTop: 10, fontSize: 12, color: '#444' },
  lista: { marginTop: 12, gap: 14 },

  cartao: { paddingVertical: 16 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartaoTitulo: { flex: 1, fontSize: 14, fontWeight: '800', color: '#111' },
  etiqueta: { paddingHorizontal: 8, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  etiquetaTexto: { fontSize: 8, color: '#222' },
  info: { fontSize: 10, color: '#222', lineHeight: 15 },

  corpo: { marginTop: 14, gap: 12 },
  areaTexto: { minHeight: 90, padding: 12, borderRadius: 6, backgroundColor: '#9DB9BD', fontSize: 11, color: '#111' },
  erro: { fontSize: 11, color: '#B3261E' },
  botao: { alignSelf: 'flex-end', height: 22, paddingHorizontal: 24, borderRadius: 4, backgroundColor: TEAL_ESCURO, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { fontSize: 10, color: '#fff' },

  feedbackEnviado: { padding: 12, borderRadius: 6, backgroundColor: '#9DB9BD' },
  feedbackTexto: { fontSize: 11, color: '#111', lineHeight: 15 },
  enviadoEm: { fontSize: 9, color: '#444' },

  documento: { fontSize: 10, fontWeight: '700', color: '#111' },
  caixaAss: { minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#333', borderRadius: 8 },
  caixaRotulo: { fontSize: 10, color: '#222' },

  docLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  docNome: { fontSize: 11, color: '#111' },
  docSub: { marginTop: 1, fontSize: 8, color: '#555' },
  abrir: { fontSize: 9, color: '#222' },
});