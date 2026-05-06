import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type KeyboardAvoidingViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton, AuthTextInput } from '../components/authentication';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const keyboardAvoidingBehavior: KeyboardAvoidingViewProps['behavior'] = Platform.select({
  ios: 'padding',
});

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [emailOrCnpj, setEmailOrCnpj] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = (): void => {
    navigation.navigate('Home');
  };

  const handleRegisterPress = (): void => {
    navigation.navigate('Register');
  };

  const handleForgotPasswordPress = (): void => {};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={keyboardAvoidingBehavior} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Projeto Integrador</Text>
            <Text style={styles.subtitle}>Seja bem-vindo(a)!</Text>
          </View>

          <View style={styles.form}>
            <AuthTextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmailOrCnpj}
              placeholder="Digite seu Email ou CNPJ"
              textContentType="username"
              value={emailOrCnpj}
            />
            <AuthTextInput
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              secureTextEntry
              textContentType="password"
              value={password}
            />

            <TouchableOpacity activeOpacity={0.7} onPress={handleForgotPasswordPress}>
              <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <AuthButton title="Entrar" onPress={handleLoginPress} />
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={handleRegisterPress} style={styles.registerLink}>
            <Text style={styles.registerText}>
              Não tem uma conta? <Text style={styles.registerTextHighlight}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  forgotPassword: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
  },
  form: {
    rowGap: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  keyboardView: {
    flex: 1,
  },
  registerLink: {
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  registerText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  registerTextHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
});

export default LoginScreen;
