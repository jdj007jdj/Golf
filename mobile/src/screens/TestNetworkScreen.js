import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { API_CONFIG } from '../config/api';

const TestNetworkScreen = () => {
  const [results, setResults] = useState([]);

  const testEndpoint = async (name, url) => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const time = Date.now() - startTime;
      
      return {
        name,
        url,
        status: response.status,
        time,
        success: true,
        data: await response.text(),
      };
    } catch (error) {
      return {
        name,
        url,
        status: 'Error',
        time: Date.now() - startTime,
        success: false,
        error: error.message,
      };
    }
  };

  const runTests = async () => {
    setResults([]);
    
    const tests = [
      { name: 'Config Base URL', url: API_CONFIG.BASE_URL + '/health' },
      { name: 'Localhost', url: 'http://localhost:3000/health' },
      { name: '127.0.0.1', url: 'http://127.0.0.1:3000/health' },
      { name: 'Windows IP', url: 'http://192.168.0.123:3000/health' },
      { name: 'Emulator IP', url: 'http://10.0.2.2:3000/health' },
    ];

    for (const test of tests) {
      const result = await testEndpoint(test.name, test.url);
      setResults(prev => [...prev, result]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Network Connectivity Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={runTests}>
        <Text style={styles.buttonText}>Run Tests</Text>
      </TouchableOpacity>

      <Text style={styles.configInfo}>
        Current API_HOST: {API_CONFIG.BASE_URL}
      </Text>

      {results.map((result, index) => (
        <View key={index} style={[styles.result, result.success ? styles.success : styles.error]}>
          <Text style={styles.resultName}>{result.name}</Text>
          <Text style={styles.resultUrl}>{result.url}</Text>
          <Text style={styles.resultStatus}>
            Status: {result.status} | Time: {result.time}ms
          </Text>
          {result.error && <Text style={styles.resultError}>Error: {result.error}</Text>}
          {result.success && <Text style={styles.resultData}>{result.data?.substring(0, 100)}...</Text>}
        </View>
      ))}
    </ScrollView>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  configInfo: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  result: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 2,
  },
  success: {
    borderColor: '#4caf50',
  },
  error: {
    borderColor: '#f44336',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultUrl: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  resultStatus: {
    fontSize: 14,
  },
  resultError: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 5,
  },
  resultData: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default TestNetworkScreen;