import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AssinaturaTexto } from '@/components/assinatura-texto';
import { BotaoComAviso } from '@/components/botao-com-aviso';
import { Card } from '@/components/card';
import { Grade } from '@/components/grade';
import { SuccessBanner } from '@/components/success-banner';
import { useAuth } from '@/context/auth-context';
import { useAtividades, useDocumentos, useHomeColaborador } from '@/data/data-context';
import { formatarData } from '@/data/format';
import { abrirPdf } from '@/services/pdf/abrir-pdf';
import { documentoConclusao } from '@/services/pdf/conclusao';
import { documentoTermos } from '@/services/pdf/termos';
import { useResponsivo } from '@/hooks/use-responsivo';

/*
 * Documentos do colaborador: termos aceitos, termo de conclusão (resumo e assinaturas) e biblioteca.
 * A tela abre a qualquer momento da jornada. O termo de conclusão só é liberado depois que TODAS as
 * atividades foram concluídas, e o "Formulário On The Job" (já com as assinaturas do colaborador e
 * do gestor) só entra na biblioteca depois que os dois assinaram (regra do servidor).
 * Ordem das assinaturas: colaborador primeiro; depois o gestor (que assina na área dele).
 */

const dois = (n: number) => String(n).padStart(2, '0');

export default function Documentos() {
  const r = useResponsivo();
  const router = useRouter();
  const d = useDocumentos();
  const { user } = useAuth();
  const { semanas: semanasAtividades } = useAtividades();
  const { feedbacks } = useHomeColaborador();
  const [aberto, setAberto] = useState<string | null>(null);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/colaborador' as Href);
  }

  const assinou = !!d.assinaturaColaborador;

  // PDF dos termos aceitos, com o registro do aceite (nova aba no navegador; visualizador no celular)
  function abrirTermos() {
    if (!user || !d.termos) return;
    abrirPdf(documentoTermos({ nome: user.nome, email: user.email, perfil: user.role, aceitoEm: d.termos.aceitoEm, versao: d.termos.versao }));
  }

  // Termo de conclusão do onboarding: todas as atividades em detalhe + as duas assinaturas.
  // Só existe depois que colaborador e gestor assinaram.
  function abrirConclusao() {
    if (!user || !d.assinaturaColaborador || !d.assinaturaGestor) return;
    abrirPdf(
      documentoConclusao({
        colaborador: { nome: d.nome, cargo: d.cargo, email: user.email },
        inicio: d.inicio,
        fim: d.fim,
        semanas: semanasAtividades.map((sem) => ({
          semana: sem.semana,
          tema: d.semanas.find((x) => x.semana === sem.semana)?.tema ?? '',
          atividades: sem.atividades,
        })),
        feedbacks,
        assinaturaColaborador: d.assinaturaColaborador,
        assinaturaGestor: d.assinaturaGestor,
      })
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Colaborador" />

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.content, r.conteudo]} showsVerticalScrollIndicator={false}>
          <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
            <Text style={s.voltarTexto}>Voltar</Text>
          </Pressable>

          <Text style={s.titulo}>Documentos</Text>
          <Text style={s.subtitulo}>Orientações, materiais e finalização do acompanhamento.</Text>

          {/* Telas largas: termos e termo de conclusão à esquerda, biblioteca à direita */}
          <Grade colunas={r.colunas(2)} gap={r.largo ? 20 : 0}>
            <View>
              {/* Termos de uso / LGPD aceitos no primeiro acesso: disponíveis desde o início */}
              {!!d.termos && (
                <Card style={s.bloco}>
                  <Text style={s.blocoTitulo}>Termos aceitos</Text>
                  <View style={[s.docLinha, { marginTop: 10 }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={20} color="#3B8D9C" />
                    <View style={{ flex: 1 }}>
                      <Text style={s.docNome}>Termos de Uso e Política de Privacidade (LGPD)</Text>
                      <Text style={s.docSub}>
                        LGPD • PDF • aceito em {formatarData(d.termos.aceitoEm)} • versão {d.termos.versao}
                      </Text>
                    </View>
                    <Pressable onPress={abrirTermos} hitSlop={8} accessibilityRole="button" accessibilityLabel="Abrir PDF dos termos">
                      <Text style={s.abrir}>Abrir</Text>
                    </Pressable>
                  </View>
                </Card>
              )}

              {/* Termo de conclusão: resumo e assinaturas só depois de concluir todas as atividades */}
              {!d.liberado ? (
                <Card style={s.bloco}>
                  <Text style={s.blocoTitulo}>Termo de conclusão</Text>
                  <Text style={[s.linhaInfo, { marginTop: 6 }]}>
                    O resumo do acompanhamento e as assinaturas do colaborador e do gestor ficam disponíveis após a
                    conclusão de todas as atividades.
                  </Text>
                  <Text style={[s.linhaInfo, { marginTop: 6 }]}>
                    Atividades concluídas: {d.atividadesRealizadas} de {d.total}
                  </Text>
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
                </>
              )}
            </View>

            {/* Biblioteca de documentos: disponível durante toda a jornada */}
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
                    <Pressable
                      // O formulário (termo de conclusão assinado) é gerado em PDF; os demais ainda são simulados
                      onPress={() => (doc.id.startsWith('form-') ? abrirConclusao() : setAberto(doc.titulo))}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir ${doc.titulo}`}>
                      <Text style={s.abrir}>Abrir</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </Card>
          </Grade>
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