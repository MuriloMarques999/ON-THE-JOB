import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AssinaturaTexto } from '@/components/assinatura-texto';
import { BotaoComAviso } from '@/components/botao-com-aviso';
import { Card } from '@/components/card';
import { SuccessBanner } from '@/components/success-banner';
import { useDocumentos } from '@/data/data-context';
import { formatarData } from '@/data/format';

/*
 * Documentos do colaborador: resumo do acompanhamento, assinaturas e biblioteca.
 * Só abre depois que TODAS as atividades foram concluídas.
 * Ordem das assinaturas: colaborador primeiro; depois o gestor (que assina na área dele).
 */

const dois = (n: number) => String(n).padStart(2, '0');

export default function Documentos() {
  const router = useRouter();
  const d = useDocumentos();
  const [aberto, setAberto] = useState<string | null>(null);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/colaborador' as Href);
  }

  const assinou = !!d.assinaturaColaborador;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Colaborador" />

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
            <Text style={s.voltarTexto}>Voltar</Text>
          </Pressable>

          <Text style={s.titulo}>Documentos</Text>
          <Text style={s.subtitulo}>Orientações, materiais e finalização do acompanhamento.</Text>

          {!d.liberado ? (
            <Card style={s.bloco}>
              <Text style={s.blocoTitulo}>Documentos indisponíveis</Text>
              <Text style={s.linhaInfo}>Você poderá acessar os documentos depois de concluir todas as atividades.</Text>
            </Card>
          ) : (
            <>
              {/* Resumo do acompanhamento */}
              <Card style={s.bloco}>
                <Text style={s.blocoTitulo}>Resumo do acompanhamento</Text>
                <Text style={[s.linhaInfo, { marginTop: 10 }]}>{d.nome}</Text>
                <Text style={s.linhaInfo}>{d.cargo}</Text>
                <Text style={s.linhaInfo}>
                  Período de acompanhamento: {formatarData(d.inicio)} até {formatarData(d.fim)}
                </Text>

                <View style={s.indicadores}>
                  <Indicador valor={dois(d.atividadesRealizadas)} rotulo="atividades realizadas" />
                  <Indicador valor={dois(d.feedbacks)} rotulo={d.feedbacks === 1 ? 'feedback registrado' : 'feedbacks registrados'} />
                  {assinou && <Indicador valor={String(d.percentual)} rotulo="conclusão" />}
                </View>

                {/* Assinaturas */}
                <View style={s.caixaAss}>
                  <Text style={s.caixaRotulo}>Assinatura do colaborador</Text>
                  {d.assinaturaColaborador ? (
                    <AssinaturaTexto nome={d.assinaturaColaborador.nome} />
                  ) : (
                    <BotaoComAviso
                      compacto
                      texto="Assinar"
                      icone="square-edit-outline"
                      habilitado
                      onPress={() => router.push('/colaborador/assinar-documento' as Href)}
                    />
                  )}
                </View>

                <View style={s.caixaAss}>
                  <Text style={s.caixaRotulo}>Assinatura do gestor</Text>
                  {d.assinaturaGestor ? (
                    <AssinaturaTexto nome={d.assinaturaGestor.nome} />
                  ) : (
                    // Só o gestor pode assinar aqui: o botão fica sempre desabilitado para o colaborador
                    <BotaoComAviso
                      compacto
                      texto="Assinar"
                      icone="square-edit-outline"
                      habilitado={false}
                      onPress={() => {}}
                      aviso={
                        assinou
                          ? 'O gestor já foi notificado da sua assinatura.'
                          : 'O gestor só poderá assinar depois da sua assinatura.'
                      }
                    />
                  )}
                </View>
              </Card>

              {/* Biblioteca de documentos */}
              <Card style={s.bloco}>
                <Text style={s.blocoTitulo}>Biblioteca de documentos</Text>
                <View style={{ marginTop: 14 }}>
                  {d.biblioteca.map((doc) => (
                    <View key={doc.id} style={s.docLinha}>
                      <MaterialCommunityIcons name="file-document-outline" size={20} color="#3B8D9C" />
                      <View style={{ flex: 1 }}>
                        <Text style={s.docNome}>{doc.titulo}</Text>
                        <Text style={s.docSub}>
                          {doc.tipo} • {doc.formato}
                        </Text>
                      </View>
                      <Pressable onPress={() => setAberto(doc.titulo)} hitSlop={8} accessibilityRole="button">
                        <Text style={s.abrir}>Abrir</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </Card>
            </>
          )}
        </ScrollView>

        {/* Download simulado: o PDF real virá do backend */}
        <SuccessBanner
          visible={aberto !== null}
          titulo="Abrindo documento"
          mensagem={`${aberto ?? ''} (PDF)`}
          nota="(simulação: nenhum arquivo foi baixado)"
          onClose={() => setAberto(null)}
        />
      </View>
    </SafeAreaView>
  );
}

function Indicador({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={s.indicador}>
      <Text style={s.indicadorValor}>{valor}</Text>
      <Text style={s.indicadorRotulo}>{rotulo}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 48 },

  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  voltarTexto: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },

  titulo: { marginTop: 16, fontSize: 30, fontWeight: '800', color: '#111', lineHeight: 36 },
  subtitulo: { marginTop: 6, fontSize: 12, color: '#222' },

  bloco: { marginTop: 20, padding: 18 },
  blocoTitulo: { fontSize: 16, fontWeight: '800', color: '#111' },
  linhaInfo: { fontSize: 11, color: '#222', lineHeight: 16 },

  // minHeight reserva espaço das 3 linhas: as caixas de assinatura não "pulam" quando surge "conclusão"
  indicadores: { marginTop: 20, gap: 8, minHeight: 88 },
  indicador: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 24, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#9DB9BD' },
  indicadorValor: { fontSize: 10, fontWeight: '800', color: '#111' },
  indicadorRotulo: { fontSize: 10, color: '#111' },

  caixaAss: { marginTop: 14, minHeight: 62, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#333', borderRadius: 8 },
  caixaRotulo: { fontSize: 11, color: '#222' },

  docLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  docNome: { fontSize: 11, color: '#111' },
  docSub: { marginTop: 1, fontSize: 8, color: '#555' },
  abrir: { fontSize: 9, color: '#222' },
});