import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type AnimatedPressableProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  pressedScale?: number;
  style?: PressableProps['style'];
  wrapperStyle?: StyleProp<ViewStyle>;
};

export function AnimatedPressable({
  children,
  onPressIn,
  onPressOut,
  pressedScale = 0.97,
  style,
  wrapperStyle,
  ...props
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number): void => {
    Animated.spring(scale, {
      damping: 18,
      mass: 0.8,
      stiffness: 260,
      toValue,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = (event: GestureResponderEvent): void => {
    animateScale(pressedScale);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent): void => {
    animateScale(1);
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[wrapperStyle, { transform: [{ scale }] }]}>
      <Pressable
        {...props}
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
