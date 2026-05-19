import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type StreamingNoticeProps = {
  description: string;
  title: string;
};

export function StreamingNotice({ description, title }: StreamingNoticeProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [progress, title]);

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.iconBox}>
        <Ionicons color={colors.primaryDark} name="radio-outline" size={20} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#E9F8F5',
    borderColor: '#BFE7E1',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.md,
    columnGap: spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  title: {
    ...typography.button,
    color: colors.text,
  },
});

export default StreamingNotice;
