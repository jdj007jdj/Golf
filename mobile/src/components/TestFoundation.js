/**
 * Golf Intelligence Foundation Test Component
 * 
 * Add this component to your app temporarily to test all
 * the course performance utilities we've built.
 * 
 * Usage:
 * Import and add <TestFoundation /> to any screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { runFoundationTests, demoClubIntelligence } from '../utils/testFoundation';

const TestFoundation = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = () => {
    setIsRunning(true);
    setTestResults(null);
    
    try {
      console.log('🧪 Starting Golf Intelligence Tests...');
      const results = runFoundationTests();
      setTestResults(results);
      
      if (results.success) {
        Alert.alert(
          '🎉 All Tests Passed!',
          `Golf Intelligence Foundation is working perfectly!\n\nSuccess Rate: ${results.successRate}%\n\nReady to proceed with Step 2: Scorecard Integration`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      } else {
        Alert.alert(
          '⚠️ Some Tests Failed',
          `${results.results.failed} test(s) failed. Check console for details.\n\nSuccess Rate: ${results.successRate}%`,
          [{ text: 'Check Console', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Test execution error:', error);
      Alert.alert('Test Error', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runClubDemo = () => {
    console.log('\n🏌️ Running Club Intelligence Demo...');
    demoClubIntelligence(1); // Demo hole 1
    Alert.alert(
      '🏌️ Club Intelligence Demo',
      'Club intelligence demo completed! Check console for detailed analysis of hole-specific club recommendations.',
      [{ text: 'Cool!', style: 'default' }]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED': return '#4CAF50';
      case 'FAILED': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Golf Intelligence Foundation Test</Text>
      <Text style={styles.subtitle}>
        Test all course performance utilities before continuing with Step 2
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? '🧪 Running Tests...' : '🧪 Run Foundation Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={runClubDemo}
          disabled={isRunning}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            🏌️ Demo Club Intelligence
          </Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tests Run:</Text>
              <Text style={styles.summaryValue}>
                {testResults.results.passed + testResults.results.failed}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Passed:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                {testResults.results.passed}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Failed:</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                {testResults.results.failed}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Success Rate:</Text>
              <Text style={[
                styles.summaryValue,
                { color: testResults.successRate === 100 ? '#4CAF50' : '#FF9800' }
              ]}>
                {testResults.successRate}%
              </Text>
            </View>
          </View>

          <ScrollView style={styles.testList}>
            {testResults.results.tests.map((test, index) => (
              <View key={index} style={styles.testItem}>
                <View style={styles.testHeader}>
                  <Text
                    style={[styles.testStatus, { color: getStatusColor(test.status) }]}
                  >
                    {test.status === 'PASSED' ? '✅' : '❌'} {test.status}
                  </Text>
                </View>
                <Text style={styles.testName}>{test.name}</Text>
                {test.status === 'FAILED' && (
                  <Text style={styles.testError}>{test.error}</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsTitle}>
              {testResults.success ? '🚀 Ready for Next Step' : '⚠️ Fix Issues First'}
            </Text>
            <Text style={styles.nextStepsText}>
              {testResults.success
                ? 'All foundation systems are working correctly. Ready to proceed with Step 2: Scorecard Integration with intelligent club recommendations!'
                : 'Please check console logs and fix any failed tests before proceeding to Step 2.'
              }
            </Text>
          </View>
        </View>
      )}

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📋 What This Tests:</Text>
        <Text style={styles.instructionItem}>📊 Course performance analysis</Text>
        <Text style={styles.instructionItem}>🔍 Data filtering and sorting</Text>
        <Text style={styles.instructionItem}>📈 Performance trend detection</Text>
        <Text style={styles.instructionItem}>🏌️ Club intelligence & recommendations</Text>
        <Text style={styles.instructionItem}>📱 Scorecard integration features</Text>
        <Text style={styles.instructionItem}>📈 Complete performance summaries</Text>
      </View>

      <Text style={styles.note}>
        💡 Check console logs for detailed test output and club intelligence insights
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#2e7d32',
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  summaryItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  testList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  testItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testName: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  testStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    fontStyle: 'italic',
  },
  nextStepsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  note: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TestFoundation;