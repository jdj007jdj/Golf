/**
 * @file screens/auth/RegisterScreen.tsx
 * @description Register screen component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

/**
 * Register screen component (placeholder for Phase 0)
 */
export const RegisterScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Golf App</Text>
        <Text style={styles.subtitle}>Register Screen</Text>
        <Text style={styles.placeholder}>
          Registration functionality will be implemented in Phase 1
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#666666',
    marginBottom: 32,
  },
  placeholder: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 24,
  },
});