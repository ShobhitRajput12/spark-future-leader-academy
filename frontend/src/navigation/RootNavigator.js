import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import MainTabs from './MainTabs';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen options={{ headerShown: false }} name="Tabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

