import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import RootNavigator from './navigation/RootNavigator';
import { navTheme } from './theme/colors';

export default function AppRoot() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

