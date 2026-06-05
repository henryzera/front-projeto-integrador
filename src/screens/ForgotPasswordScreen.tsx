import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type KeyboardAvoidingViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AuthButton, AuthTextInput } from '../components/authentication';
import { ApiError, requestPasswordReset, resetPassword } from '../services';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import { forgotPasswordRequestSchema, resetPasswordFormSchema } from '../validation/auth';

type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

type ForgotPasswordStep = 'request' | 'reset';

const keyboardAvoidingBehavior: KeyboardAvoidingViewProps['behavior'] = Platform.select({
  ios: 'padding',
});

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestPress = async (): Promise<void> => {
    setFormError('');
    setInfoMessage('');

    try {
      const data = forgotPasswordRequestSchema.parse({ identifier });

      setIsSubmitting(true);
      const response = await requestPasswordReset(data.identifier);

      if (response.resetToken) {
        // Em ambiente de desenvolvimento o backend devolve o token diretamente.
        setToken(response.resetToken);
        setInfoMessage(
          `Modo de desenvolvimento: código preenchido automaticamente. Válido por ${response.expiresInMinutes} minutos.`,
        );
        setStep('reset');
        return;
      }

      setInfoMessage('Se a conta existir, enviamos as instruções de recuperação.');
      setStep('reset');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormError(error.issues[0]?.message || 'Revise os dados informados.');
        return;
      }

      if (error instanceof ApiError) {
        setFormError(error.message);
        return;
      }

      setFormError('Não foi possível solicitar a recuperação agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPress = async (): Promise<void> => {
    setFormError('');

    try {
      const data = resetPasswordFormSchema.parse({
        confirmPassword,
        newPassword,
        token,
      });

      setIsSubmitting(true);
      await resetPassword(data.token, data.newPassword);

      Alert.alert(
        'Senha redefinida',
        'Sua senha foi atualizada com sucesso. Faça login com a nova senha.',
        [{ onPress: () => navigation.navigate('Login'), text: 'Entrar' }],
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormError(error.issues[0]?.message || 'Revise os dados informados.');
        return;
      }

      if (error instanceof ApiError) {
        setFormError(error.message);
        return;
      }

      setFormError('Não foi possível redefinir sua senha agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginPress = (): void => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={keyboardAvoidingBehavior} style={styles.keyboardView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>
              {step === 'request'
                ? 'Informe seu email ou CNPJ para receber as instruções.'
                : 'Informe o código recebido e crie uma nova senha.'}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'request' ? (
              <AuthTextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setIdentifier}
                placeholder="Email ou CNPJ"
                textContentType="username"
                value={identifier}
              />
            ) : (
              <>
                <AuthTextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setToken}
                  placeholder="Código de recuperação"
                  value={token}
                />
                <AuthTextInput
                  onChangeText={setNewPassword}
                  placeholder="Nova senha"
                  secureTextEntry
                  textContentType="newPassword"
                  value={newPassword}
                />
                <AuthTextInput
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmar nova senha"
                  secureTextEntry
                  textContentType="newPassword"
                  value={confirmPassword}
                />
              </>
            )}

            {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <AuthButton
              title={step === 'request' ? 'Enviar instruções' : 'Redefinir senha'}
              onPress={step === 'request' ? handleRequestPress : handleResetPress}
              isLoading={isSubmitting}
            />
          </View>

          {step === 'reset' ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setFormError('');
                setStep('request');
              }}
              style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Voltar</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity activeOpacity={0.7} onPress={handleLoginPress} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Lembrou a senha? <Text style={styles.loginTextHighlight}>Entrar</Text>
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
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  form: {
    rowGap: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  loginLink: {
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loginTextHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  secondaryAction: {
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  secondaryActionText: {
    ...typography.button,
    color: colors.primary,
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

export default ForgotPasswordScreen;
