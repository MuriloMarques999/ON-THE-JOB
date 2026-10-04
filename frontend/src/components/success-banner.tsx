import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

type Props = {
  visible: boolean;
  titulo: string;
  mensagem: string;
  nota?: string;
  onClose: () => void;
};

// Aviso de sucesso: caixa verde-azulada no centro, com o fundo esmaecido.
// Deve ser colocado como último filho de uma View com `flex: 1` (ocupa toda a área dela).
export function SuccessBanner({ visible, titulo, mensagem, nota, onClose }: Props) {
  if (!visible) return null;

  return (
    <Pressable style={s.overlay} onPress={onClose} accessibilityLabel="Fechar aviso">
      <View style={s.banner} accessibilityRole="alert">
        <MaterialCommunityIcons name="check-circle-outline" size={26} color="#fff" />

        <View style={s.textos}>
          <Text style={s.texto}>{titulo}</Text>
          <Text style={s.texto}>{mensagem}</Text>
          {!!nota && <Text style={s.nota}>{nota}</Text>}
        </View>

        <Pressable onPress={onClose} hitSlop={12} style={s.fechar} accessibilityLabel="Fechar aviso">
          <MaterialCommunityIcons name="close-circle-outline" size={18} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );
}

// No navegador o fundo fica realmente desfocado; no celular fica só esmaecido.
const desfoque = Platform.select<ViewStyle>({
  web: { backdropFilter: 'blur(6px)' } as ViewStyle,
  default: {},
});

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(240, 239, 240, 0.7)',
    ...desfoque,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 34,
    borderRadius: 8,
    backgroundColor: '#2B6F7A',
  },
  textos: { flex: 1, alignItems: 'center', gap: 2 },
  texto: { color: '#fff', fontSize: 12, lineHeight: 16, textAlign: 'center' },
  nota: { marginTop: 4, color: '#fff', opacity: 0.8, fontSize: 10, textAlign: 'center' },
  fechar: { position: 'absolute', top: 10, right: 10 },
});
