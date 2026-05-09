import { LayoutAnimation, Platform, UIManager } from 'react-native';

let layoutAnimationsEnabled = false;

export function configureNextLayoutAnimation(): void {
  if (!layoutAnimationsEnabled) {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }

    layoutAnimationsEnabled = true;
  }

  LayoutAnimation.configureNext({
    create: {
      duration: 180,
      property: LayoutAnimation.Properties.opacity,
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      duration: 140,
      property: LayoutAnimation.Properties.opacity,
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    duration: 240,
    update: {
      duration: 240,
      springDamping: 0.86,
      type: LayoutAnimation.Types.spring,
    },
  });
}
