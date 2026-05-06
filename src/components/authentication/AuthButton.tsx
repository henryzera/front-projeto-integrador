import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors, spacing, typography } from '../../theme';

export interface AuthButtonProps {
  disabled?: boolean;
  isLoading?: boolean;
  title: string;
  onPress: () => void;
}

export function AuthButton({ disabled = false, isLoading = false, title, onPress }: AuthButtonProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={[styles.button, (disabled || isLoading) && styles.buttonDisabled]}>
      {isLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.title}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  title: {
    ...typography.button,
    color: colors.white,
  },
});

export default AuthButton;
