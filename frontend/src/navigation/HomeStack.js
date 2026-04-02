import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertsUpdatesScreen from '../screens/AlertsUpdatesScreen';
import CareersScreen from '../screens/CareersScreen';
import FitnessMedicalScreen from '../screens/FitnessMedicalScreen';
import HomeScreen from '../screens/HomeScreen';
import PreparationScreen from '../screens/PreparationScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets?.top || 0,
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
  );

  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ navigation, route, options }) => (
          <View style={[styles.header, { paddingTop: topInset + 6, minHeight: topInset + 54 }]}>
            <Pressable
              onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : null)}
              hitSlop={10}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {options?.title ?? route?.name ?? ''}
            </Text>
            <View style={styles.backBtnSpacer} />
          </View>
        ),
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    backgroundColor: colors.glass2,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  backBtnSpacer: { width: 34, height: 34 },
  headerTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '800', marginLeft: 6 },
});
