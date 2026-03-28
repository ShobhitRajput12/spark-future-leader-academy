import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import AiChatScreen from '../screens/AiChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SchemesScreen from '../screens/SchemesScreen';
import { colors } from '../theme/colors';
import HomeStack from './HomeStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentBlue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = focused ? size + 2 : size;
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

