import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { API_CONFIG } from './config/api';

const TestAPI = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiTestResult, setApiTestResult] = useState(null);

  // Test health endpoint
  const testHealthEndpoint = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.HEALTH;
      console.log('Attempting to connect to:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setHealthStatus(data);
      } else {
        setError(`Health check failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test authenticated API call
  const testApiCall = async () => {
    setLoading(true);
    setError(null);
    setApiTestResult(null);
    
    try {
      // First, let's try to access courses without auth (should fail)
      const url = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.COURSES;
      console.log('Testing API call to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // This is expected - we need authentication
        setApiTestResult({
          status: response.status,
          message: data.error?.message || 'API call failed',
          expectedError: true,
          description: 'This error is expected - the API requires authentication'
        });
      } else {
        setApiTestResult({
          status: response.status,
          data: data,
          expectedError: false
        });
      }
    } catch (err) {
      setError(`API test error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test connection on mount
    testHealthEndpoint();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Golf App - API Connection Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Status</Text>
        <Text style={styles.info}>URL: {API_CONFIG.BASE_URL}</Text>
        
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
        
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
        
        {healthStatus && (
          <View style={styles.success}>
            <Text style={styles.successText}>✓ Connected Successfully!</Text>
            <Text style={styles.detail}>Message: {healthStatus.message}</Text>
            <Text style={styles.detail}>Environment: {healthStatus.environment}</Text>
            <Text style={styles.detail}>Time: {new Date(healthStatus.timestamp).toLocaleString()}</Text>
          </View>
        )}
        
        <Button 
          title="Retry Connection" 
          onPress={testHealthEndpoint}
          disabled={loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Test (Protected Route)</Text>
        <Text style={styles.info}>Testing: GET /api/courses</Text>
        
        {apiTestResult && (
          <View style={apiTestResult.expectedError ? styles.warning : styles.error}>
            <Text style={styles.warningText}>
              Status: {apiTestResult.status}
            </Text>
            <Text style={styles.warningText}>
              {apiTestResult.message}
            </Text>
            {apiTestResult.description && (
              <Text style={styles.detail}>{apiTestResult.description}</Text>
            )}
          </View>
        )}
        
        <Button 
          title="Test API Call" 
          onPress={testApiCall}
          disabled={loading}
        />
      </View>
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
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginVertical: 10,
    fontSize: 14,
  },
  success: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detail: {
    color: '#1b5e20',
    fontSize: 12,
    marginTop: 2,
  },
  warning: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    marginBottom: 2,
  },
});

export default TestAPI;