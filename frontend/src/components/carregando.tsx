import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tela simples de "carregando", usada enquanto uma tela espera a resposta do servidor
// antes de decidir se pode ser exibida (ex.: assinatura de documento).
export function Carregando() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.centro}>
        <ActivityIndicator size="large" color="#2B6F7A" />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});