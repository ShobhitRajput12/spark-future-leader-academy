import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

export default function TypingDots({ color = colors.muted }) {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 420, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a]);

  return (
    <View style={styles.row}>
      <Dot color={color} anim={a} />
      <Dot color={color} anim={a} />
      <Dot color={color} anim={a} />
    </View>
  );
}

function Dot({ anim, color }) {
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });
  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color, opacity, transform: [{ translateY }, { scale }] }]}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: 14, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 999 },
});
