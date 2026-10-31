import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AssinaturaTexto } from '@/components/assinatura-texto';
import { Card } from '@/components/card';
import { Carregando } from '@/components/carregando';
import { useAuth } from '@/context/auth-context';
import { useAcoesGestor, useAssinaturaGestor } from '@/data/data-context';
import { formatarData } from '@/data/format';
import { useResponsivo } from '@/hooks/use-responsivo';

/*
 * Assinatura do gestor (depois que o colaborador já assinou).
 *   Passo 1: digita o nome completo e toca em "Confirmar assinatura" -> a assinatura aparece no espaço
 *   Passo 2: toca em "Finalizar assinatura" -> grava e volta para Documentos com o resultado final
 * "Limpar" apaga a assinatura para refazer. Parâmetro: `id` = documento a assinar.
 */

export default function AssinarDocumentoGestor() {
  const r = useResponsivo();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tela, carregando } = useAssinaturaGestor(id);
  const { assinarDocumento } = useAcoesGestor();

  const [nome, setNome] = useState('');
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [assinado, setAssinado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Se não puder assinar, volta para a lista. Depois de assinar, volta com o card do documento aberto
  // (resultado final) e o aviso de sucesso.
  const destino = {
    pathname: '/gestor/atencao',
    params: assinado ? { item: `${id}-ass`, ok: 'assinado' } : { item: `${id}-ass` },
  } as unknown as Href;
  // Assinou: volta direto. Não dá para esperar `tela` virar null, porque a consulta mantém o dado
  // anterior quando o servidor passa a responder 404 (documento já assinado).
  if (assinado) return <Redirect href={destino} />;
  if (carregando && !tela) return <Carregando />; // espera a resposta do servidor
  if (!tela) return <Redirect href={destino} />;
  const documentoId = tela.documentoId;

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/gestor/atencao' as Href);
  }

  function limpar() {
    setPrevia(null);
    setNome('');
    setErro('');
  }

  function alterarNome(texto: string) {
    setNome(texto);
    setErro('');
    if (previa !== null) setPrevia(null);
  }

  function confirmar() {
    const limpo = nome.trim().replace(/\s+/g, ' ');
    if (limpo.split(' ').length < 2) {
      setErro('Digite seu nome completo para assinar.');
      return;
    }
    setErro('');
    setPrevia(limpo);
  }

  async function finalizar() {
    if (previa === null || enviando) return;
    setEnviando(true);
    const resultado = await assinarDocumento(documentoId, previa);
    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.error);
      return;
    }
    setAssinado(true); // com o documento já assinado, a tela redireciona sozinha para a lista
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Gestor" />

      <ScrollView contentContainerStyle={[s.content, r.conteudoEstreito]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
          <Text style={s.voltarTexto}>Voltar</Text>
        </Pressable>

        <Text style={s.titulo}>Documentos</Text>
        <Text style={s.subtitulo}>Orientações, materiais e finalização do acompanhamento.</Text>

        <Card style={s.bloco}>
          <Text style={s.blocoTitulo}>Resumo do acompanhamento</Text>
          <Text style={[s.linhaInfo, { marginTop: 10 }]}>{tela.nome}</Text>
          <Text style={s.linhaInfo}>{tela.cargo}</Text>
          <Text style={s.linhaInfo}>
            Período de acompanhamento: {formatarData(tela.inicio)} até {formatarData(tela.fim)}
          </Text>
          <Text style={[s.linhaInfo, { marginTop: 6 }]}>
            {tela.titulo} · {tela.atividadesRealizadas} de {tela.total} atividades realizadas
          </Text>

          <Text style={s.secaoTitulo}>Atividades realizadas</Text>
          <View style={s.lista}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {tela.semanas.map((sem, i) => (
                <View key={sem.semana} style={[s.semana, i > 0 && s.semanaDivisor]}>
                  <Text style={s.semanaTitulo}>
                    Semana {sem.semana} - {sem.tema}
                  </Text>
                  {sem.atividades.length === 0 && <Text style={s.atividade}>Nenhuma atividade concluída.</Text>}
                  {sem.atividades.map((titulo) => (
                    <Text key={titulo} style={s.atividade}>
                      {titulo}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>

          <Text style={s.secaoTitulo}>Espaço para assinatura digital</Text>
          <Text style={s.descricao}>Ao assinar você valida as informações que foram fornecidas pelo colaborador.</Text>

          <View style={s.espaco}>{previa !== null && <AssinaturaTexto nome={previa} tamanho={30} />}</View>
          <View style={s.espacoRodape}>
            <Text style={s.miudo}>Assinatura capturada</Text>
            <Pressable style={s.limpar} onPress={limpar} hitSlop={8} accessibilityRole="button">
              <MaterialCommunityIcons name="eraser" size={11} color="#222" />
              <Text style={s.miudo}>Limpar</Text>
            </Pressable>
          </View>

          <Text style={s.rotulo}>Nome completo</Text>
          <TextInput
            style={s.input}
            value={nome}
            onChangeText={alterarNome}
            placeholder={user?.nome ?? 'Seu nome completo'}
            placeholderTextColor="#777"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={confirmar}
          />

          {!!erro && <Text style={s.erro}>{erro}</Text>}
          {previa !== null && <Text style={s.dica}>Confira sua assinatura e toque em “Finalizar assinatura”.</Text>}

          <Pressable style={s.botao} onPress={previa === null ? confirmar : finalizar} accessibilityRole="button">
            <Text style={s.botaoTexto}>{previa === null ? 'Confirmar assinatura' : 'Finalizar assinatura'}</Text>
            <MaterialCommunityIcons name="square-edit-outline" size={12} color="#fff" />
          </Pressable>
        </Card>
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
  subtitulo: { marginTop: 6, fontSize: 12, color: '#222' },

  bloco: { marginTop: 20, padding: 18 },
  blocoTitulo: { fontSize: 16, fontWeight: '800', color: '#111' },
  linhaInfo: { fontSize: 11, color: '#222', lineHeight: 16 },

  secaoTitulo: { marginTop: 26, fontSize: 16, fontWeight: '800', color: '#111' },
  descricao: { marginTop: 4, fontSize: 10, color: '#333', lineHeight: 14 },

  lista: { marginTop: 12, height: 136, padding: 10, borderRadius: 8, backgroundColor: '#9DB9BD' },
  semana: { paddingBottom: 8 },
  semanaDivisor: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#D9D9D9' },
  semanaTitulo: { fontSize: 10, color: '#111', marginBottom: 6 },
  atividade: { fontSize: 10, color: '#111', lineHeight: 15 },

  espaco: { marginTop: 12, height: 100, borderRadius: 8, backgroundColor: '#9DB9BD', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  espacoRodape: { marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miudo: { fontSize: 8, color: '#333' },
  limpar: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  rotulo: { marginTop: 18, fontSize: 11, fontWeight: '800', color: '#111' },
  input: { marginTop: 6, height: 30, paddingHorizontal: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#333', borderRadius: 6, fontSize: 11, color: '#111' },

  erro: { marginTop: 8, fontSize: 11, color: '#B3261E' },
  dica: { marginTop: 8, fontSize: 10, color: TEAL_ESCURO },

  botao: { alignSelf: 'center', marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 24, paddingHorizontal: 26, borderRadius: 4, backgroundColor: TEAL_ESCURO },
  botaoTexto: { fontSize: 10, color: '#fff' },
});