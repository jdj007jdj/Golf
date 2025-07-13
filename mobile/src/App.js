import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <AppNavigator />
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;