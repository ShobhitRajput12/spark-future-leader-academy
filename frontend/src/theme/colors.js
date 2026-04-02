import { DarkTheme } from '@react-navigation/native';

export const colors = {
  bg: '#05060A',
  card: '#0B0E16',
  card2: '#0D101B',
  border: 'rgba(255,255,255,0.10)',
  text: '#F4F7FF',
  muted: 'rgba(244,247,255,0.70)',
  faint: 'rgba(244,247,255,0.44)',
  accentOrange: '#FF8A1F',
  accentGreen: '#2BFF9B',
  accentBlue: '#4FD3FF',
  accentPurple: '#B39BFF',
  danger: '#FF3B30',

  // Premium “glass” surfaces
  glass: 'rgba(255,255,255,0.035)',
  glass2: 'rgba(255,255,255,0.025)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glowBlue: 'rgba(79,211,255,0.18)',
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
