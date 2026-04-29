import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme';

export function HomeScreen() {
  const handleStartPress = (): void => {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textGroup}>
          <Text style={styles.title}>Projeto Integrador</Text>
          <Text style={styles.description}>
            Base inicial preparada para evoluir o onboarding com consistencia visual.
          </Text>
        </View>

        <Button title="Comecar" onPress={handleStartPress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: spacing.lg,
  },
  textGroup: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});

export default HomeScreen;
