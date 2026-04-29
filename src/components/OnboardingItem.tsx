import { Dimensions, Image, type ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

const screenWidth = Dimensions.get('window').width;

export interface OnboardingItemProps {
  title: string;
  description: string;
  image: ImageSourcePropType;
}

export function OnboardingItem({ title, description, image }: OnboardingItemProps) {
  return (
    <View style={styles.container}>
      <Image source={image} resizeMode="contain" style={styles.image} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    width: screenWidth,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: spacing.lg,
    textAlign: 'center',
  },
  image: {
    aspectRatio: 1,
    marginBottom: spacing.xl,
    maxHeight: 320,
    width: '100%',
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default OnboardingItem;
