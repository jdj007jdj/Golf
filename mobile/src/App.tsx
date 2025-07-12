/**
 * @file App.tsx
 * @description Main App component with navigation and providers
 */

import React from 'react';
import {StatusBar, View, Text, ActivityIndicator} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {store, persistor} from '@/store';
import {AppNavigator} from '@/navigation/AppNavigator';
import {DatabaseProvider} from '@/database/DatabaseProvider';
import {AuthProvider} from '@/services/auth/AuthProvider';

/**
 * Loading component for redux persist
 */
const PersistLoading: React.FC = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff'}}>
    <ActivityIndicator size="large" color="#4caf50" />
    <Text style={{marginTop: 16, fontSize: 16, color: '#666'}}>Loading...</Text>
  </View>
);

/**
 * Main App component
 * @returns {JSX.Element} The main app component
 */
const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<PersistLoading />} persistor={persistor}>
            <DatabaseProvider>
              <AuthProvider>
                <NavigationContainer>
                  <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                  <AppNavigator />
                </NavigationContainer>
              </AuthProvider>
            </DatabaseProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;