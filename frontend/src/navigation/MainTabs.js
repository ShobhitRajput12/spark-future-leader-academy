import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AiChatScreen from '../screens/AiChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SchemesScreen from '../screens/SchemesScreen';
import { colors } from '../theme/colors';
import HomeStack from './HomeStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 360;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentBlue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: isSmallDevice ? 10 : 11,
          fontWeight: '600',
          marginBottom: 4,
          paddingBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarIcon: ({ color, focused }) => {
          const baseIconSize = isSmallDevice ? 20 : 22;
          const iconSize = focused ? baseIconSize + 2 : baseIconSize;
          const iconName = (() => {
            switch (route.name) {
              case 'Home':
                return focused ? 'home' : 'home-outline';
              case 'AI Chat':
                return focused ? 'sparkles' : 'sparkles-outline';
              case 'Schemes':
                return focused ? 'grid' : 'grid-outline';
              case 'Profile':
                return focused ? 'person' : 'person-outline';
              default:
                return 'ellipse';
            }
          })();
          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="AI Chat" component={AiChatScreen} />
      <Tab.Screen name="Schemes" component={SchemesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
