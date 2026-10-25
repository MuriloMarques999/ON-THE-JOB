import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Card } from '@/components/card';
import { SuccessBanner } from '@/components/success-banner';
import { useAssinaturas, useSolicitarAssinatura } from '@/data/data-context';
import { STATUS_ASSINATURA } from '@/data/format';
import type { ItemAssinatura } from '@/data/queries';
import type { StatusAssinatura } from '@/data/types';

/*
 * Assinatura de documentos (RH): documentos assinados e pendentes de cada colaborador e gestor.
 * Os pendentes vêm ordenados por quem espera há mais tempo.
 */

export default function AssinaturaDocumentos() {
  const router = useRouter();
  const { assinados, pendentes } = useAssinaturas();
  const solicitarAssinatura = useSolicitarAssinatura();

  const [assinadosAberto, setAssinadosAberto] = useState(false);
  const [pendentesAberto, setPendentesAberto] = useState(true);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [avisoNome, setAvisoNome] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  function alternar(id: string) {
    setExpandidos((e) => ({ ...e, [id]: !e[id] }));
  }

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/rh' as Href);
  }

  function solicitar(item: ItemAssinatura) {
    const resultado = solicitarAssinatura(item.id);
    if (!resultado.ok) {
      setErro(resultado.error);
      return;
    }
    setErro('');
    setAvisoNome(item.nome);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader perfil="Recursos Humanos" />

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Pressable style={s.voltar} onPress={voltar} hitSlop={8} accessibilityRole="button">
            <MaterialCommunityIcons name="arrow-left" size={16} color="#111" />
            <Text style={s.voltarTexto}>Voltar</Text>
          </Pressable>

          <Text style={s.titulo}>Assinatura de documentos</Text>
          <Text style={s.subtitulo}>Visualize todos documentos assinados e pendentes de cada colaborador e gestor.</Text>

          {!!erro && <Text style={s.erro}>{erro}</Text>}

          {/* Documentos assinados */}
          <Card style={s.secao}>
            <CabecalhoSecao
              total={assinados.length}
              singular="Documento assinado"
              plural="Documentos assinados"
              aberto={assinadosAberto}
              onPress={() => setAssinadosAberto((v) => !v)}
            />
            {assinadosAberto && (
              <Lista
                itens={assinados}
                vazio="Nenhum documento assinado ainda."
                subtitulo="Assinaturas concluídas"
                expandidos={expandidos}
                onAlternar={alternar}
              />
            )}
          </Card>

          {/* Documentos pendentes */}
          <Card style={s.secao}>
            <CabecalhoSecao
              total={pendentes.length}
              singular="Documento pendente"
              plural="Documentos pendentes"
              aberto={pendentesAberto}
              onPress={() => setPendentesAberto((v) => !v)}
            />
            {pendentesAberto && (
              <Lista
                itens={pendentes}
                vazio="Nenhum documento pendente."
                subtitulo="Assinaturas pendentes"
                expandidos={expandidos}
                onAlternar={alternar}
                onSolicitar={solicitar}
              />
            )}
          </Card>
        </ScrollView>

        {/* Aviso (toast) ao solicitar assinatura — nada é enviado por enquanto */}
        <SuccessBanner
          visible={avisoNome !== null}
          titulo="Assinatura solicitada!"
          mensagem={`Pedido de assinatura registrado para ${avisoNome ?? ''}.`}
          nota="(simulação: nenhuma mensagem foi enviada)"
          onClose={() => setAvisoNome(null)}
        />
      </View>
    </SafeAreaView>
  );
}

function CabecalhoSecao({
  total,
  singular,
  plural,
  aberto,
  onPress,
}: {
  total: number;
  singular: string;
  plural: string;
  aberto: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={s.secaoCabecalho} onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded: aberto }}>
      <Text style={s.contagem}>{total}</Text>
      <Text style={s.secaoTitulo}>{total === 1 ? singular : plural}</Text>
      <MaterialCommunityIcons name={aberto ? 'chevron-up' : 'chevron-down'} size={26} color={TEAL_ESCURO} />
    </Pressable>
  );
}

function Lista({
  itens,
  vazio,
  subtitulo,
  expandidos,
  onAlternar,
  onSolicitar,
}: {
  itens: ItemAssinatura[];
  vazio: string;
  subtitulo: string;
  expandidos: Record<string, boolean>;
  onAlternar: (id: string) => void;
  onSolicitar?: (item: ItemAssinatura) => void;
}) {
  if (itens.length === 0) return <Text style={s.vazio}>{vazio}</Text>;

  return (
    <View style={s.lista}>
      {itens.map((item, i) => {
        const aberto = !!expandidos[item.id];

        return (
          <View key={item.id} style={[s.item, i < itens.length - 1 && s.itemDivisor]}>
            <Pressable
              style={s.itemCabecalho}
              onPress={() => onAlternar(item.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: aberto }}>
              <View style={{ flex: 1 }}>
                <Text style={s.nome}>{item.nome}</Text>
                <Text style={s.sub}>{subtitulo}</Text>
              </View>
              <MaterialCommunityIcons name={aberto ? 'chevron-up' : 'chevron-down'} size={24} color={TEAL_ESCURO} />
            </Pressable>

            {aberto && (
              <View style={s.detalhe}>
                <Text style={s.documento}>{item.documento}</Text>
                <LinhaStatus rotulo="Colaborador:" status={item.colaborador} />
                <LinhaStatus rotulo="Gestor:" status={item.gestor} />

                {onSolicitar && (
                  <Pressable style={s.solicitar} onPress={() => onSolicitar(item)} accessibilityRole="button">
                    <Text style={s.solicitarTexto}>Solicitar assinatura</Text>
                    <MaterialCommunityIcons name="square-edit-outline" size={12} color="#fff" />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function LinhaStatus({ rotulo, status }: { rotulo: string; status: StatusAssinatura }) {
  return (
    <View style={s.statusLinha}>
      <Text style={s.statusRotulo}>{rotulo}</Text>
      <View style={[s.pilula, { backgroundColor: STATUS_ASSINATURA[status].cor }]}>
        <Text style={s.pilulaTexto}>{STATUS_ASSINATURA[status].label}</Text>
      </View>
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
  subtitulo: { marginTop: 12, fontSize: 14, color: '#222', lineHeight: 20 },
  erro: { marginTop: 12, fontSize: 12, color: '#B3261E' },

  secao: { marginTop: 20 },
  secaoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contagem: { fontSize: 20, fontWeight: '800', color: '#111' },
  secaoTitulo: { flex: 1, fontSize: 15, fontWeight: '800', color: '#111' },

  vazio: { marginTop: 14, fontSize: 12, color: '#444' },

  lista: { marginTop: 18 },
  item: { paddingVertical: 8 },
  itemDivisor: { borderBottomWidth: 1, borderBottomColor: '#A9A9A9' },
  itemCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nome: { fontSize: 11, fontWeight: '800', color: '#111' },
  sub: { marginTop: 2, fontSize: 10, color: '#333' },

  detalhe: { marginTop: 8, paddingBottom: 6, gap: 8 },
  documento: { fontSize: 10, color: '#333' },
  statusLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusRotulo: { fontSize: 10, color: '#222' },
  pilula: { width: 100, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pilulaTexto: { fontSize: 9, color: '#222' },

  solicitar: { alignSelf: 'center', marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 24, paddingHorizontal: 26, borderRadius: 4, backgroundColor: TEAL_ESCURO },
  solicitarTexto: { fontSize: 10, color: '#fff' },
});