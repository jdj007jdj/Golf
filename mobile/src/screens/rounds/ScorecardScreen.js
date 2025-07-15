import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ErrorBoundary from '../../components/ErrorBoundary';

console.log('🔍 ScorecardScreen: Starting import...');

let ScorecardContainer;
try {
  ScorecardContainer = require('./components/ScorecardContainer').default;
  console.log('✅ ScorecardScreen: Successfully imported ScorecardContainer');
} catch (error) {
  console.error('❌ ScorecardScreen: Failed to import ScorecardContainer:', error);
  ScorecardContainer = null;
}

const ScorecardScreen = ({ route, navigation }) => {
  console.log('🔍 ScorecardScreen: Rendering with route:', route?.params);
  
  if (!ScorecardContainer) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load ScorecardContainer</Text>
        <Text style={styles.errorDetails}>Check console for import errors</Text>
      </View>
    );
  }

  try {
    return (
      <ErrorBoundary>
        <ScorecardContainer route={route} navigation={navigation} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('❌ ScorecardScreen: Runtime error:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Runtime Error</Text>
        <Text style={styles.errorDetails}>{error.toString()}</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ScorecardScreen;