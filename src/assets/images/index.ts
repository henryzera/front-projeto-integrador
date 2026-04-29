import type { ImageSourcePropType } from 'react-native';

type Images = {
  onboarding1: ImageSourcePropType;
  onboarding2: ImageSourcePropType;
  onboarding3: ImageSourcePropType;
};

export const images: Images = {
  onboarding1: require('./onboarding/onboarding-1.png'),
  onboarding2: require('./onboarding/onboarding-2.png'),
  onboarding3: require('./onboarding/onboarding-3.png'),
};
