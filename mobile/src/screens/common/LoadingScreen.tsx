/**
 * @file screens/common/LoadingScreen.tsx
 * @description Loading screen component
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

/**
 * Loading screen component
 */
export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Golf App</Text>
      <Text style={styles.subText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333333',
  },
  subText: {
    fontSize: 16,
    marginTop: 8,
    color: '#666666',
  },
});