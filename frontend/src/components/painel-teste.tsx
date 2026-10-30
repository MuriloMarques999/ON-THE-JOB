import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { apagarDadosTeste, convitesPendentes, MODO_TESTE } from '@/services/mock-api';

// Ajuda do modo de teste (npm run mock), mostrada na tela de login: os acessos de exemplo e os links
// dos convites que o RH gerou (no sistema real, eles chegariam por e-mail).
export function PainelTeste() {
  const [, atualizar] = useState(0);
  if (!MODO_TESTE) return null;

  const convites = convitesPendentes();

  return (
    <View style={s.painel}>
      <Text style={s.titulo}>Modo de teste (sem backend)</Text>
      <Text style={s.texto}>Senha de todos os usuários de exemplo: 123456</Text>
      <Text style={s.texto}>RH: rh@platform.com</Text>
      <Text style={s.texto}>Gestor: gestor@platform.com</Text>
      <Text style={s.texto}>Colaborador: colaborador@platform.com</Text>
      <Text style={s.texto}>Falta 1 atividade para assinar: pedro.almeida@platform.com</Text>
      <Text style={s.texto}>Já pode assinar: marina.alves@platform.com</Text>

      <Text style={[s.titulo, { marginTop: 12 }]}>Convites pendentes</Text>
      {convites.length === 0 ? (
        <Text style={s.texto}>Nenhum. Entre como RH e cadastre um colaborador ou gestor.</Text>
      ) : (
        convites.map((c) => (
          <Link
            key={c.email}
            href={{ pathname: '/concluir-conta', params: { perfil: c.perfil, email: c.email, token: c.token } } as Href}
            style={s.link}>
            Concluir conta de {c.nome} ({c.perfil}) — {c.email}
          </Link>
        ))
      )}

      <Pressable
        onPress={() => {
          apagarDadosTeste();
          atualizar((n) => n + 1);
        }}
        style={s.apagar}
        accessibilityRole="button">
        <Text style={s.apagarTexto}>Apagar dados de teste</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  painel: { marginTop: 32, padding: 14, gap: 3, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#25626B', backgroundColor: '#E6F0F1' },
  titulo: { fontSize: 12, fontWeight: '800', color: '#25626B' },
  texto: { fontSize: 11, color: '#222' },
  link: { marginTop: 4, fontSize: 11, color: '#25626B', textDecorationLine: 'underline' },
  apagar: { marginTop: 10, alignSelf: 'flex-start' },
  apagarTexto: { fontSize: 11, color: '#8A2B2B', fontWeight: '700' },
});
