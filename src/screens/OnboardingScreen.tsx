import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  FlatList,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { images } from '../assets/images';
import { Button } from '../components/Button';
import { OnboardingItem } from '../components/OnboardingItem';
import { PaginationDots } from '../components/PaginationDots';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../types/navigation';

type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
};

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'opportunities',
    title: 'Licitações na palma da sua mão',
    description:
      'Encontre as melhores oportunidades públicas exclusivas para MEIs e microempresas em Recife e região.',
    image: images.onboarding1,
  },
  {
    id: 'simple-notices',
    title: 'Chega de editais complicados',
    description:
      'Nossa IA analisa os requisitos da Lei 14.133/2021 e te diz exatamente o que você precisa para participar, sem juridiquês.',
    image: images.onboarding2,
  },
  {
    id: 'deadlines',
    title: 'Prazos sob controle',
    description:
      'Organize seus documentos de habilitação e receba alertas para nunca mais perder a data de uma proposta.',
    image: images.onboarding3,
  },
];

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const { width } = useWindowDimensions();

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(nextIndex);
  };

  const handleContinuePress = (): void => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < onboardingSlides.length) {
      flatListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
      setCurrentIndex(nextIndex);
      return;
    }

    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleScrollEnd}
        pagingEnabled
        renderItem={({ item }) => (
          <OnboardingItem title={item.title} description={item.description} image={item.image} />
        )}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <PaginationDots total={onboardingSlides.length} currentIndex={currentIndex} />

        <View style={styles.buttonWrapper}>
          <Button title="Continuar" onPress={handleContinuePress} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    width: '80%',
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    rowGap: spacing.lg,
  },
});

export default OnboardingScreen;
