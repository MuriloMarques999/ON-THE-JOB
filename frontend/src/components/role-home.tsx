import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/auth-context';

// Placeholder compartilhado pelas 3 telas iniciais. Substitua por cada layout real.
export function RoleHome({ titulo }: { titulo: string }) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{titulo}</Text>
        <Text style={styles.text}>
          Olá, {user?.nome} ({user?.email})
        </Text>
        <Pressable style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EFF0' },
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#111' },
  text: { fontSize: 15, color: '#333' },
  button: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 24, height: 40, borderRadius: 6, backgroundColor: '#25626B', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 15 },
});
