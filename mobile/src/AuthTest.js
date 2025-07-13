import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_CONFIG } from './config/api';

const AuthTest = () => {
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Registration form
  const [registerData, setRegisterData] = useState({
    email: 'test@golf.com',
    username: 'testgolfer',
    password: 'password123',
    firstName: 'Test',
    lastName: 'Golfer',
  });
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: 'test@golf.com',
    password: 'password123',
  });

  // Register new user
  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Registration successful! You can now login.');
        // Update login form with registered email
        setLoginData({ ...loginData, email: registerData.email });
      } else {
        Alert.alert('Registration Failed', data.error?.message || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuthToken(data.data.token);
        setUserData(data.data.user);
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Login Failed', data.error?.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test authenticated endpoint
  const testAuthenticatedCall = async () => {
    if (!authToken) {
      Alert.alert('Error', 'Please login first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.COURSES, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', `Authenticated call successful! Found ${data.data.length} courses.`);
      } else {
        Alert.alert('Error', data.error?.message || 'Failed to fetch courses');
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Authentication Test</Text>
      
      {/* Registration Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Register New User</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={registerData.email}
          onChangeText={(text) => setRegisterData({...registerData, email: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={registerData.username}
          onChangeText={(text) => setRegisterData({...registerData, username: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={registerData.password}
          secureTextEntry
          onChangeText={(text) => setRegisterData({...registerData, password: text})}
        />
        <Button title="Register" onPress={handleRegister} disabled={loading} />
      </View>

      {/* Login Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={loginData.email}
          onChangeText={(text) => setLoginData({...loginData, email: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={loginData.password}
          secureTextEntry
          onChangeText={(text) => setLoginData({...loginData, password: text})}
        />
        <Button title="Login" onPress={handleLogin} disabled={loading} />
      </View>

      {/* User Info Section */}
      {userData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logged In User</Text>
          <Text style={styles.info}>Name: {userData.firstName} {userData.lastName}</Text>
          <Text style={styles.info}>Email: {userData.email}</Text>
          <Text style={styles.info}>Username: {userData.username}</Text>
          <Text style={styles.tokenText}>Token: {authToken?.substring(0, 20)}...</Text>
        </View>
      )}

      {/* Test Authenticated Call */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Test Authenticated API Call</Text>
        <Text style={styles.info}>This will call GET /api/courses with auth token</Text>
        <Button 
          title="Test Authenticated Call" 
          onPress={testAuthenticatedCall} 
          disabled={loading || !authToken} 
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  loader: {
    marginVertical: 20,
  },
});

export default AuthTest;