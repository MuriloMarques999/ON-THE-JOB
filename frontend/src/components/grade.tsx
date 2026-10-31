import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/*
 * Grade de cartões para telas largas: distribui os filhos em linhas de `colunas` itens de mesma largura.
 * Com 1 coluna (celular) é só uma View empilhando os filhos, como antes.
 * `esticar`: cartões da mesma linha com a mesma altura (painéis); sem ele, cada um com a sua altura
 * (listas com cartões que abrem e fecham).
 */
export function Grade({
  colunas,
  gap = 16,
  esticar = false,
  style,
  children,
}: {
  colunas: number;
  gap?: number;
  esticar?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const itens = Children.toArray(children).filter(isValidElement);

  if (colunas <= 1) return <View style={[{ gap }, style]}>{itens}</View>;

  const linhas: (typeof itens)[] = [];
  for (let i = 0; i < itens.length; i += colunas) linhas.push(itens.slice(i, i + colunas));

  return (
    <View style={[{ gap }, style]}>
      {linhas.map((linha, i) => (
        <View key={i} style={{ flexDirection: 'row', gap, alignItems: esticar ? 'stretch' : 'flex-start' }}>
          {linha.map((item) => (
            <View key={item.key} style={{ flex: 1, minWidth: 0 }}>
              {esticar ? esticarItem(item as ReactElement<{ style?: StyleProp<ViewStyle> }>) : item}
            </View>
          ))}
          {/* completa a última linha para os cartões manterem a mesma largura */}
          {Array.from({ length: colunas - linha.length }, (_, j) => (
            <View key={`vazio-${j}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// O cartão ocupa toda a altura da linha (o filho precisa aceitar `style`, como Card, View e Pressable)
function esticarItem(item: ReactElement<{ style?: StyleProp<ViewStyle> }>) {
  return cloneElement(item, { style: [item.props.style, { flex: 1 }] });
}
