import { StyleSheet, Text, View } from 'react-native';

import { STATUS_JORNADA } from '@/data/format';
import type { StatusJornada } from '@/data/types';

type Valores = Record<StatusJornada, number>;

// Mesma ordem e cores dos status em todo o app
const ORDEM: StatusJornada[] = ['concluida', 'em_andamento', 'pendente', 'atrasada'];

const total = (v: Valores) => ORDEM.reduce((soma, k) => soma + v[k], 0);

// Gráfico de barra empilhada: cada fatia é a quantidade de colaboradores em um status.
export function BarraStatus({ valores, altura = 12 }: { valores: Valores; altura?: number }) {
  const t = total(valores);
  const descricao = ORDEM.map((k) => `${STATUS_JORNADA[k].label}: ${valores[k]}`).join(', ');

  return (
    <View style={[s.trilho, { height: altura, borderRadius: altura / 2 }]} accessibilityRole="image" accessibilityLabel={descricao}>
      {t > 0 &&
        ORDEM.filter((k) => valores[k] > 0).map((k) => (
          <View key={k} style={{ flex: valores[k], backgroundColor: STATUS_JORNADA[k].cor }} />
        ))}
    </View>
  );
}

// Legenda do gráfico: bolinha colorida, nome do status e quantidade.
export function LegendaStatus({ valores, mostrarZeros = true }: { valores: Valores; mostrarZeros?: boolean }) {
  return (
    <View style={s.legenda}>
      {ORDEM.filter((k) => mostrarZeros || valores[k] > 0).map((k) => (
        <View key={k} style={s.legendaItem}>
          <View style={[s.ponto, { backgroundColor: STATUS_JORNADA[k].cor }]} />
          <Text style={s.legendaTexto}>
            {STATUS_JORNADA[k].label} <Text style={s.legendaValor}>{valores[k]}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  trilho: { flexDirection: 'row', width: '100%', gap: 2, overflow: 'hidden', backgroundColor: '#C4C4C4' },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  legendaTexto: { fontSize: 10, color: '#333' },
  legendaValor: { fontWeight: '800', color: '#111' },
});