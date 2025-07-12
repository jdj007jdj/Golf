/**
 * @file navigation/AppNavigator.tsx
 * @description Main app navigation component
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAppSelector } from '@/store';
import { RootStackParamList, BottomTabParamList } from '@/types';

// Screens (placeholders for Phase 0)
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { HomeScreen } from '@/screens/main/HomeScreen';
import { LoadingScreen } from '@/screens/common/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

/**
 * Main tab navigator for authenticated users
 */
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      }}>
      <Tab.Screen
        name="Play"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Play',
        }}
      />
      <Tab.Screen
        name="Rounds"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Rounds',
        }}
      />
      <Tab.Screen
        name="Courses"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Courses',
        }}
      />
      <Tab.Screen
        name="Social"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Social',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Auth stack for unauthenticated users
 */
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

/**
 * Main app navigator
 */
export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {isAuthenticated ? (
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}