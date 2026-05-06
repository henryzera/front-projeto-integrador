import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors, spacing, typography } from '../../theme';

type BaseTextInputProps = Omit<
  TextInputProps,
  'onChangeText' | 'placeholderTextColor' | 'style' | 'value'
>;

export interface AuthTextInputProps extends BaseTextInputProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function AuthTextInput({ onChangeText, value, ...props }: AuthTextInputProps) {
  return (
    <TextInput
      {...props}
      onChangeText={onChangeText}
      placeholderTextColor={colors.textSecondary}
      style={styles.input}
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...typography.body,
    borderColor: colors.grayLight,
    borderRadius: spacing.md,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: '100%',
  },
});

export default AuthTextInput;
