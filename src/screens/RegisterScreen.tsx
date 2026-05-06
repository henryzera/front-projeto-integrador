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

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

type RegisterFormValues = {
  email: string;
  firstName: string;
  lastName: string;
  cnpj: string;
  cnae: string;
  password: string;
  confirmPassword: string;
};

const totalSteps = 3;

const keyboardAvoidingBehavior: KeyboardAvoidingViewProps['behavior'] = Platform.select({
  ios: 'padding',
});

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState<RegisterFormValues>({
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

  const handleNextPress = (): void => {
    setStep((currentStep) => Math.min(currentStep + 1, totalSteps));
  };

  const handleBackPress = (): void => {
    setStep((currentStep) => Math.max(currentStep - 1, 1));
  };

  const handleSubmitPress = (): void => {
    navigation.navigate('Login');
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
              </>
            )}

            <AuthButton
              title={step < totalSteps ? 'Próximo' : 'Cadastrar'}
              onPress={step < totalSteps ? handleNextPress : handleSubmitPress}
            />
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
