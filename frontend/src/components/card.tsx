import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// Cartão cinza arredondado usado nas telas iniciais.
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  card: { borderRadius: 14, backgroundColor: '#D9D9D9', padding: 16 },
});
