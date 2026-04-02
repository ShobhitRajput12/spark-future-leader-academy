import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import AiChatScreen from '../screens/AiChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SchemesScreen from '../screens/SchemesScreen';
import HomeStack from './HomeStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={() => null}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="AI Chat" component={AiChatScreen} />
      <Tab.Screen name="Schemes" component={SchemesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
