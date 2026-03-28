import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

export default function Screen({ children, padded = true }) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[colors.bg, '#070716', colors.bg]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1 },
  padded: { paddingHorizontal: 18, paddingTop: 8 },
});

