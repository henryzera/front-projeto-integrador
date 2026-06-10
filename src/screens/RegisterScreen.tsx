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
import { z } from 'zod';

import { AuthButton, AuthTextInput } from '../components/authentication';
import { ApiError } from '../services';
import { useAuth } from '../store';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import { registerFormSchema } from '../validation/auth';

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

type RegisterFormValues = {
  email: string;
  firstName: string;
  lastName: string;
  cnpj: string;
  cnae: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const totalSteps = 3;

const keyboardAvoidingBehavior: KeyboardAvoidingViewProps['behavior'] = Platform.select({
  ios: 'padding',
});

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { signUp } = useAuth();
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState<RegisterFormValues>({
    acceptTerms: false,
    cnae: '',
    cnpj: '',
    confirmPassword: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  const updateField =
    (field: keyof RegisterFormValues) =>
    (value: string): void => {
      setFormValues((currentValues) => ({
        ...currentValues,
        [field]: value,
      }));
    };

  const toggleAcceptTerms = (): void => {
    setFormError('');
    setFormValues((currentValues) => ({
      ...currentValues,
      acceptTerms: !currentValues.acceptTerms,
    }));
  };

  const handleNextPress = (): void => {
    setFormError('');

    if (step === 1 && (!formValues.email || !formValues.firstName || !formValues.lastName)) {
      setFormError('Preencha seus dados pessoais para continuar.');
      return;
    }

    if (step === 2 && (!formValues.cnpj || !formValues.cnae)) {
      setFormError('Preencha CNPJ e CNAE para continuar.');
      return;
    }

    setStep((currentStep) => Math.min(currentStep + 1, totalSteps));
  };

  const handleBackPress = (): void => {
    setFormError('');
    setStep((currentStep) => Math.max(currentStep - 1, 1));
  };

  const handleSubmitPress = async (): Promise<void> => {
    setFormError('');

    if (!formValues.acceptTerms) {
      setFormError('É necessário aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    try {
      const data = registerFormSchema.parse(formValues);

      setIsSubmitting(true);
      await signUp(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormError(error.issues[0]?.message || 'Revise os dados informados.');
        return;
      }

      if (error instanceof ApiError) {
        setFormError(error.message);
        return;
      }

      setFormError('Nao foi possivel criar sua conta agora.');
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
            <Text style={styles.title}>Crie uma conta</Text>
            <Text style={styles.step}>Passo {step} de {totalSteps}</Text>
          </View>

          <View style={styles.form}>
            {step === 1 && (
              <>
                <AuthTextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={updateField('email')}
                  placeholder="Email"
                  textContentType="emailAddress"
                  value={formValues.email}
                />
                <AuthTextInput
                  onChangeText={updateField('firstName')}
                  placeholder="Nome"
                  textContentType="givenName"
                  value={formValues.firstName}
                />
                <AuthTextInput
                  onChangeText={updateField('lastName')}
                  placeholder="Sobrenome"
                  textContentType="familyName"
                  value={formValues.lastName}
                />
              </>
            )}

            {step === 2 && (
              <>
                <AuthTextInput
                  keyboardType="number-pad"
                  onChangeText={updateField('cnpj')}
                  placeholder="CNPJ"
                  value={formValues.cnpj}
                />
                <AuthTextInput
                  keyboardType="number-pad"
                  onChangeText={updateField('cnae')}
                  placeholder="CNAE"
                  value={formValues.cnae}
                />
              </>
            )}

            {step === 3 && (
              <>
                <AuthTextInput
                  onChangeText={updateField('password')}
                  placeholder="Senha"
                  secureTextEntry
                  textContentType="newPassword"
                  value={formValues.password}
                />
                <AuthTextInput
                  onChangeText={updateField('confirmPassword')}
                  placeholder="Confirmar senha"
                  secureTextEntry
                  textContentType="newPassword"
                  value={formValues.confirmPassword}
                />

                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: formValues.acceptTerms }}
                  activeOpacity={0.7}
                  onPress={toggleAcceptTerms}
                  style={styles.consentRow}
                >
                  <View style={[styles.checkbox, formValues.acceptTerms && styles.checkboxChecked]}>
                    {formValues.acceptTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.consentText}>
                    Li e concordo com os{' '}
                    <Text style={styles.consentHighlight}>Termos de Uso</Text> e a{' '}
                    <Text style={styles.consentHighlight}>Política de Privacidade</Text>, autorizando o
                    tratamento dos meus dados conforme a LGPD.
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <AuthButton
              title={step < totalSteps ? 'Próximo' : 'Cadastrar'}
              onPress={step < totalSteps ? handleNextPress : handleSubmitPress}
              isLoading={isSubmitting}
            />

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          </View>

          {step > 1 && (
            <TouchableOpacity activeOpacity={0.7} onPress={handleBackPress} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Voltar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.7} onPress={handleLoginPress} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Já tem uma conta? <Text style={styles.loginTextHighlight}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  consentHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  consentRow: {
    alignItems: 'flex-start',
    columnGap: spacing.sm,
    flexDirection: 'row',
  },
  consentText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  form: {
    rowGap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  keyboardView: {
    flex: 1,
  },
  loginLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
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
  step: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
});

export default RegisterScreen;
