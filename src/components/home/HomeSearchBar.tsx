import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

export interface HomeSearchBarProps {
  query: string;
  onChangeQuery: (query: string) => void;
  onClear: () => void;
}

export function HomeSearchBar({ query, onChangeQuery, onClear }: HomeSearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons color={colors.textSecondary} name="arrow-back" size={24} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeQuery}
        placeholder="Buscar por objeto, cidade,..."
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={query}
      />
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={onClear}>
        <Ionicons color={colors.textSecondary} name="close" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: spacing.xl,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});

export default HomeSearchBar;
