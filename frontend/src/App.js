import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './navigation/RootNavigator';
import { navTheme } from './theme/colors';
import { colors } from './theme/colors';

export default function AppRoot() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    html.style.minHeight = '100%';
    html.style.backgroundColor = colors.bg;
    body.style.minHeight = '100vh';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.backgroundColor = colors.bg;
    if (root) {
      root.style.minHeight = '100vh';
      root.style.backgroundColor = colors.bg;
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <View style={Platform.OS === 'web' ? styles.webRoot : styles.nativeRoot}>
          <RootNavigator />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = {
  nativeRoot: { flex: 1 },
  webRoot: { flex: 1, minHeight: '100vh', backgroundColor: colors.bg },
};
