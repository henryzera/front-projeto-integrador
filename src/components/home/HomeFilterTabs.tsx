import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

export type HomeFilter = 'mei' | 'location' | 'cnaes';

type FilterOption = {
  label: string;
  value: HomeFilter;
};

export interface HomeFilterTabsProps {
  activeFilter: HomeFilter;
  onChangeFilter: (filter: HomeFilter) => void;
}

const filterOptions: FilterOption[] = [
  { label: 'Oportunidades MEI', value: 'mei' },
  { label: 'Recife/PE', value: 'location' },
  { label: 'Meu CNAE', value: 'cnaes' },
];

export function HomeFilterTabs({ activeFilter, onChangeFilter }: HomeFilterTabsProps) {
  return (
    <View style={styles.container}>
      {filterOptions.map((option) => {
        const isActive = option.value === activeFilter;

        return (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.75}
            key={option.value}
            onPress={() => onChangeFilter(option.value)}
            style={[styles.item, isActive && styles.activeItem]}>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeItem: {
    backgroundColor: colors.primary,
    borderRadius: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeLabel: {
    color: colors.white,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
});

export default HomeFilterTabs;
