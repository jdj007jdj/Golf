import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main app screens
import HomeScreen from '../screens/main/HomeScreen';
import CourseListScreen from '../screens/courses/CourseListScreen';
import CourseDetailsScreen from '../screens/courses/CourseDetailsScreen';
import StartRoundScreen from '../screens/rounds/StartRoundScreen';
import ScorecardScreen from '../screens/rounds/ScorecardScreen';
import RoundSummaryScreen from '../screens/rounds/RoundSummaryScreen';
import RoundHistoryScreen from '../screens/rounds/RoundHistoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import StatisticsScreen from '../screens/statistics/StatisticsScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const MainStack = ({ initialRouteName, initialParams }) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName || "Home"}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        initialParams={initialParams?.Home}
      />
      <Stack.Screen name="CourseList" component={CourseListScreen} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
      <Stack.Screen name="StartRound" component={StartRoundScreen} />
      <Stack.Screen 
        name="Scorecard" 
        component={ScorecardScreen}
        initialParams={initialParams?.Scorecard}
      />
      <Stack.Screen name="RoundSummary" component={RoundSummaryScreen} />
      <Stack.Screen name="RoundHistory" component={RoundHistoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const [checkingActiveRound, setCheckingActiveRound] = useState(true);
  const [activeRound, setActiveRound] = useState(null);

  // Check for active round when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      checkForActiveRound();
    } else if (!isAuthenticated) {
      setCheckingActiveRound(false);
    }
  }, [isAuthenticated, isLoading]);

  const checkForActiveRound = async () => {
    try {
      const activeRoundData = await AsyncStorage.getItem('golf_active_round');
      if (activeRoundData) {
        const parsedRoundData = JSON.parse(activeRoundData);
        setActiveRound(parsedRoundData);
      }
    } catch (error) {
      console.error('Error checking for active round:', error);
    } finally {
      setCheckingActiveRound(false);
    }
  };

  if (isLoading || checkingActiveRound) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  // Determine initial route and params based on active round
  let initialRouteName = "Home";
  let initialParams = {};
  
  if (activeRound && isAuthenticated) {
    initialRouteName = "Scorecard";
    initialParams = {
      Scorecard: {
        round: activeRound.round,
        course: activeRound.course
      }
    };
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainStack 
          initialRouteName={initialRouteName} 
          initialParams={initialParams}
        />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;