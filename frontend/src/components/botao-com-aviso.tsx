import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/*
 * Botão que pode ficar DESABILITADO explicando o motivo:
 * - no computador, o aviso aparece ao passar o mouse (hover)
 * - no celular, aparece ao tocar no botão (e some sozinho depois de uns segundos)
 */
export function BotaoComAviso({
  texto,
  onPress,
  habilitado,
  aviso,
  icone,
  compacto = false,
  style,
}: {
  texto: string;
  onPress: () => void;
  habilitado: boolean;
  aviso?: string;
  icone?: IconName;
  compacto?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [hover, setHover] = useState(false);
  const [toque, setToque] = useState(false);

  useEffect(() => {
    if (!toque) return;
    const t = setTimeout(() => setToque(false), 3000);
    return () => clearTimeout(t);
  }, [toque]);

  const mostrarAviso = !habilitado && !!aviso && (hover || toque);

  return (
    <View style={[s.wrapper, style]}>
      <Pressable
        onPress={() => (habilitado ? onPress() : setToque(true))}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        accessibilityRole="button"
        accessibilityState={{ disabled: !habilitado }}
        accessibilityHint={!habilitado ? aviso : undefined}
        style={[s.botao, compacto ? s.botaoCompacto : s.botaoNormal, !habilitado && s.botaoDesabilitado]}>
        <Text style={[s.texto, compacto && s.textoCompacto]}>{texto}</Text>
        {icone && <MaterialCommunityIcons name={icone} size={compacto ? 10 : 16} color="#fff" />}
      </Pressable>

      {mostrarAviso && (
        <View style={s.aviso} pointerEvents="none">
          <Text style={s.avisoTexto}>{aviso}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 20, alignSelf: 'stretch' },

  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#25626B' },
  botaoNormal: { height: 38, borderRadius: 6, paddingHorizontal: 16 },
  botaoCompacto: { alignSelf: 'center', height: 18, borderRadius: 3, paddingHorizontal: 14, gap: 4 },
  botaoDesabilitado: { backgroundColor: '#8A8A8A' },

  texto: { color: '#fff', fontSize: 14, fontWeight: '500' },
  textoCompacto: { fontSize: 8 },

  aviso: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    width: 230,
    marginLeft: -115,
    marginTop: 6,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#222',
    zIndex: 50,
    elevation: 6,
  },
  avisoTexto: { color: '#fff', fontSize: 10, lineHeight: 14, textAlign: 'center' },
});