import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

export default function Screen({ children, padded = true, safeBottom = false }) {
  const insets = useSafeAreaInsets();
  const innerStyle = [
    styles.inner,
    padded ? styles.padded : null,
    { paddingTop: (padded ? 8 : 0) + (insets?.top || 0) },
    safeBottom ? { paddingBottom: (insets?.bottom || 0) } : null,
  ];
  return (
    <SafeAreaView edges={[]} style={styles.safe}>
      <LinearGradient
        colors={[colors.bg, '#070B18', '#04050A']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(79,211,255,0.10)', 'transparent']}
        locations={[0, 1]}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <View style={innerStyle}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1 },
  padded: { paddingHorizontal: 18 },
  topGlow: { position: 'absolute', left: 0, right: 0, top: 0, height: 240 },
});
