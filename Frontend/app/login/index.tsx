import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image
} from 'react-native';

import { useRouter } from 'expo-router';

import { UserRole } from '../../src/types/auth';

export default function LoginScreen() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>('rh');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    if (role === 'rh') {
      router.replace('/rh');
    }

    if (role === 'colaborador') {
      router.replace('/colaborador');
    }

    if (role === 'gestor') {
      router.replace('/gestor');
    }
  }

  return (
    <View style={styles.container}>

      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}/>

      <Text style={styles.title}>
        On the job
      </Text>

      <Text style={styles.subtitle}>
        Novo colaborador, nova jornada digital.
      </Text>

      <Text style={styles.loginTitle}>
        Entrar na plataforma
      </Text>

      <Text style={styles.description}>
        Selecione um perfil para acesso.
      </Text>

      {/* PERFIS */}

      <TouchableOpacity
        style={[
          styles.roleButton,
          role === 'rh' && styles.selectedRole,
        ]}
        onPress={() => setRole('rh')}
      >
        <Text style={styles.roleText}>
          RH
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.roleButton,
          role === 'colaborador' && styles.selectedRole,
        ]}
        onPress={() => setRole('colaborador')}
      >
        <Text style={styles.roleText}>
          Colaborador
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.roleButton,
          role === 'gestor' && styles.selectedRole,
        ]}
        onPress={() => setRole('gestor')}
      >
        <Text style={styles.roleText}>
          Gestor
        </Text>
      </TouchableOpacity>

      {/* E-MAIL */}

      <Text style={styles.label}>
        E-mail
      </Text>

      <TextInput
        style={styles.input}
        placeholder="perfil.teste@platform.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* SENHA */}

      <Text style={styles.label}>
        Senha
      </Text>

      <TextInput
        style={styles.input}
        placeholder="••••••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* BOTÃO */}

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
      >
        <Text style={styles.loginButtonText}>
          Entrar
        </Text>
      </TouchableOpacity>

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F7',
    paddingHorizontal: 32,
    paddingTop: 70,
  },

    logo: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    marginBottom: 8,
    resizeMode: 'contain',
    },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 10,
    color: '#555555',
    textAlign: 'center',
  },

  loginTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 40,
  },

  description: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
  },

  roleButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  selectedRole: {
    backgroundColor: '#C5C5C5',
  },

  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },

  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 5,
  },

  input: {
    height: 36,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    paddingHorizontal: 12,
    fontSize: 11,
  },

  loginButton: {
    height: 40,
    borderRadius: 7,
    backgroundColor: '#267B85',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 35,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
});