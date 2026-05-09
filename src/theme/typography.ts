import type { TextStyle } from 'react-native';

type TypographyStyle = Pick<TextStyle, 'fontSize' | 'fontWeight'>;

type Typography = {
  title: TypographyStyle;
  body: TypographyStyle;
  button: TypographyStyle;
  caption: TypographyStyle;
  tabLabel: TypographyStyle;
};

export const typography: Typography = {
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
};
