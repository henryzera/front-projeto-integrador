import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme';

export interface PaginationDotsProps {
  total: number;
  currentIndex: number;
}

export function PaginationDots({ total, currentIndex }: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === currentIndex ? styles.activeDot : styles.inactiveDot]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: colors.primary,
    width: spacing.lg,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: spacing.xs,
    height: spacing.sm,
    marginHorizontal: spacing.xs,
    width: spacing.sm,
  },
  inactiveDot: {
    backgroundColor: colors.grayLight,
  },
});

export default PaginationDots;
