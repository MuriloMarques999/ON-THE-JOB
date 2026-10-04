import { StyleSheet, View } from 'react-native';

// Barra de progresso (0 a 100).
export function ProgressBar({ percent, height = 8 }: { percent: number; height?: number }) {
  const p = Math.max(0, Math.min(100, percent));

  return (
    <View
      style={[s.track, { height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: p }}>
      <View style={[s.fill, { width: `${p}%` }]} />
    </View>
  );
}

const s = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', backgroundColor: '#5FA5B2' },
  fill: { height: '100%', backgroundColor: '#25626B' },
});
