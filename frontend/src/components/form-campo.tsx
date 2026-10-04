import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Peças compartilhadas pelos formulários de cadastro (colaborador e gestor).

export const PLACEHOLDER = '#8A8A8A';
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatarTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function Campo({ label, erro, children }: { label: string; erro?: string; children: ReactNode }) {
  return (
    <View style={s.campo}>
      <Text style={s.label}>{label}</Text>
      {children}
      {!!erro && <Text style={s.erro}>{erro}</Text>}
    </View>
  );
}

export const formStyles = StyleSheet.create({
  input: { height: 40, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#D9D9D9', fontSize: 13, color: '#111' },
});

const s = StyleSheet.create({
  campo: { gap: 6 },
  label: { fontSize: 13, fontWeight: '800', color: '#111' },
  erro: { fontSize: 12, color: '#B3261E' },
});
