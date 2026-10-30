import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand-header';
import { SECOES_TERMOS, TITULO_TERMOS, VERSAO_TERMOS } from '@/constants/termos';
import { useAuth } from '@/context/auth-context';
import { formatarData } from '@/data/format';
import { abrirPdf } from '@/services/pdf/abrir-pdf';
import { documentoTermos } from '@/services/pdf/termos';

/*
 * Termos de uso e política de privacidade (LGPD).
 * - Primeiro acesso (ou nova versão dos termos): o usuário só entra na plataforma depois de marcar
 *   a caixa e aceitar. Recusar encerra a sessão, sem bloquear a conta: a cada novo login os termos
 *   aparecem de novo, até serem aceitos.
 * - Depois do aceite: não aparece mais no login; vira só consulta (menu ☰ e tela de Documentos).
 */
export default function Termos() {
  const router = useRouter();
  const { user, aceitarTermos, recusarTermos } = useAuth();
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [aceitouAgora, setAceitouAgora] = useState(false);

  if (!user) return null;

  // Acabou de aceitar, ou já tinha aceitado e caiu aqui sem ser pela consulta (menu ☰ / Documentos,
  // que deixam histórico para voltar): segue para a tela inicial do perfil.
  if (user.termosAceitos && (aceitouAgora || !router.canGoBack())) return <Redirect href={`/${user.role}` as Href} />;

  const consulta = user.termosAceitos;

  async function aceitar() {
    if (!marcado || enviando) return;
    setErro('');
    setEnviando(true);
    const r = await aceitarTermos();
    setEnviando(false);
    if (!r.ok) {
      setErro(r.error);
      return;
    }
    setAceitouAgora(true);
  }

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace(`/${user!.role}` as Href);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {consulta ? (
          <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
            <Text style={s.voltarTexto}>Voltar</Text>
          </Pressable>
        ) : (
          <BrandHeader />
        )}

        <Text style={[s.titulo, !consulta && { marginTop: 32 }]}>{TITULO_TERMOS}</Text>
        <Text style={s.subtitulo}>
          {consulta
            ? `Aceito em ${formatarData(user.termosAceitosEm ?? undefined)} • versão ${VERSAO_TERMOS}`
            : 'Antes do primeiro acesso, leia e aceite como seus dados pessoais são tratados.'}
        </Text>

        <View style={s.caixa}>
          {SECOES_TERMOS.map((secao) => (
            <View key={secao.titulo} style={s.secao}>
              <Text style={s.secaoTitulo}>{secao.titulo}</Text>
              <Text style={s.secaoTexto}>{secao.texto}</Text>
            </View>
          ))}
        </View>

        {/* Já aceito: o termo com o registro do aceite também pode ser aberto em PDF */}
        {consulta && (
          <Pressable
            style={s.botao}
            onPress={() =>
              abrirPdf(
                documentoTermos({
                  nome: user.nome,
                  email: user.email,
                  perfil: user.role,
                  aceitoEm: user.termosAceitosEm ?? '',
                  versao: VERSAO_TERMOS,
                })
              )
            }
            accessibilityRole="button">
            <Text style={s.botaoTexto}>Abrir em PDF</Text>
          </Pressable>
        )}

        {!consulta && (
          <>
            <Pressable
              style={s.check}
              onPress={() => {
                setMarcado((m) => !m);
                setErro('');
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: marcado }}>
              <MaterialCommunityIcons
                name={marcado ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={marcado ? TEAL_ESCURO : '#555'}
              />
              <Text style={s.checkTexto}>
                Li e aceito os Termos de Uso e a Política de Privacidade, e autorizo o tratamento dos meus dados
                pessoais conforme a LGPD.
              </Text>
            </Pressable>

            {!!erro && <Text style={s.erro}>{erro}</Text>}

            <Pressable
              style={[s.botao, (!marcado || enviando) && s.botaoDesabilitado]}
              onPress={aceitar}
              disabled={!marcado || enviando}
              accessibilityRole="button"
              accessibilityState={{ disabled: !marcado || enviando }}>
              <Text style={s.botaoTexto}>{enviando ? 'Enviando...' : 'Aceitar e continuar'}</Text>
            </Pressable>

            <Pressable style={s.recusar} onPress={recusarTermos} accessibilityRole="button">
              <Text style={s.recusarTexto}>Recusar e sair</Text>
            </Pressable>
            <Text style={s.aviso}>Sem o aceite, não é possível acessar a plataforma.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const TEAL_ESCURO = '#25626B';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  container: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },

  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  voltarTexto: { fontSize: 12, color: '#111', textDecorationLine: 'underline' },

  titulo: { marginTop: 16, fontSize: 24, fontWeight: '800', color: '#111', lineHeight: 30 },
  subtitulo: { marginTop: 6, fontSize: 12, color: '#222' },

  caixa: { marginTop: 20, padding: 16, borderRadius: 14, backgroundColor: '#D9D9D9', gap: 14 },
  secao: { gap: 4 },
  secaoTitulo: { fontSize: 13, fontWeight: '800', color: '#111' },
  secaoTexto: { fontSize: 12, color: '#222', lineHeight: 18 },

  check: { marginTop: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkTexto: { flex: 1, fontSize: 12, color: '#111', lineHeight: 18 },

  erro: { marginTop: 14, textAlign: 'center', color: '#B3261E', fontSize: 13 },

  botao: { marginTop: 28, height: 44, borderRadius: 6, backgroundColor: TEAL_ESCURO, alignItems: 'center', justifyContent: 'center' },
  botaoDesabilitado: { opacity: 0.45 },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: '500' },

  recusar: { marginTop: 14, alignSelf: 'center', padding: 6 },
  recusarTexto: { fontSize: 13, color: '#8A2B2B', fontWeight: '700' },
  aviso: { marginTop: 4, textAlign: 'center', fontSize: 11, color: '#555' },
});
