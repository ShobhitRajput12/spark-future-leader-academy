import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AlertsUpdatesScreen from '../screens/AlertsUpdatesScreen';
import CareersScreen from '../screens/CareersScreen';
import FitnessMedicalScreen from '../screens/FitnessMedicalScreen';
import HomeScreen from '../screens/HomeScreen';
import PreparationScreen from '../screens/PreparationScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen options={{ headerShown: false }} name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Careers" component={CareersScreen} options={{ title: 'Defence Careers' }} />
      <Stack.Screen name="Preparation" component={PreparationScreen} options={{ title: 'Preparation' }} />
      <Stack.Screen
        name="FitnessMedical"
        component={FitnessMedicalScreen}
        options={{ title: 'Fitness & Medical' }}
      />
      <Stack.Screen name="AlertsUpdates" component={AlertsUpdatesScreen} options={{ title: 'Alerts & Updates' }} />
    </Stack.Navigator>
  );
}

