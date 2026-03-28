import { DarkTheme } from '@react-navigation/native';

export const colors = {
  bg: '#06060A',
  card: '#0B0B12',
  card2: '#0F0F1A',
  border: 'rgba(255,255,255,0.08)',
  text: '#F5F7FF',
  muted: 'rgba(245,247,255,0.65)',
  faint: 'rgba(245,247,255,0.4)',
  accentOrange: '#FF7A00',
  accentGreen: '#2DFF95',
  accentBlue: '#40C9FF',
  accentPurple: '#A78BFA',
  danger: '#FF3B30',
};

export const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    border: colors.border,
    text: colors.text,
    primary: colors.accentBlue,
    notification: colors.accentOrange,
  },
};

