import { Platform, StyleSheet, Text } from 'react-native';

// Fonte manuscrita do sistema (sem instalar nada). Para ficar idêntica ao Figma, dá para trocar
// por uma fonte do Google (ex.: @expo-google-fonts/mrs-saint-delafield) mudando só esta constante.
const FONTE = Platform.select({
  ios: 'Snell Roundhand',
  android: 'cursive',
  default: '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive',
});

// Mostra o nome digitado como se fosse uma assinatura à mão.
export function AssinaturaTexto({ nome, tamanho = 26 }: { nome: string; tamanho?: number }) {
  return (
    <Text style={[s.texto, { fontSize: tamanho }]} numberOfLines={2} accessibilityLabel={`Assinatura de ${nome}`}>
      {nome}
    </Text>
  );
}

const s = StyleSheet.create({
  texto: { fontFamily: FONTE, fontStyle: 'italic', color: '#2B3A4A', textAlign: 'center' },
});