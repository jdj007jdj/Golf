import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import localAuthService from '../../services/localAuthService';
import accountConversionService from '../../services/accountConversionService';

const ConvertAccountScreen = ({ navigation, route }) => {
  const { user, convertToOnline } = useAuth();
  const { localDataStats } = route.params || {};
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConvert = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setConversionProgress({ status: 'starting', message: 'Creating online account...' });
    
    try {
      // Start conversion process
      const result = await convertToOnline(email, password);
      
      if (result.success) {
        const { conversionId, localData } = result;
        
        // Initialize conversion service
        setConversionProgress({ status: 'initializing', message: 'Preparing data for upload...' });
        await accountConversionService.initialize();
        
        // Start conversion with progress tracking
        const conversionResult = await accountConversionService.convertLocalData(
          result.token,
          conversionId,
          localData,
          (progress) => {
            setConversionProgress(progress);
          }
        );
        
        if (conversionResult.success) {
          Alert.alert(
            'Conversion Complete!',
            'Your local account has been successfully converted to an online account. All your data has been backed up to the cloud.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Conversion Partially Complete',
            `Your account was created but some data failed to sync:\n\n${conversionResult.error}\n\nYou can retry syncing from Settings.`,
            [
              {
                text: 'Continue',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Conversion Failed', result.error);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      Alert.alert('Conversion Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setConversionProgress(null);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Convert to Online</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🚀 Benefits of Online Account</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefit}>✓ Automatic cloud backup</Text>
            <Text style={styles.benefit}>✓ Access from multiple devices</Text>
            <Text style={styles.benefit}>✓ Share rounds with friends</Text>
            <Text style={styles.benefit}>✓ Detailed statistics and insights</Text>
            <Text style={styles.benefit}>✓ Never lose your data</Text>
          </View>
        </View>
        
        {localDataStats && (
          <View style={styles.dataCard}>
            <Text style={styles.dataTitle}>Data to Upload</Text>
            <View style={styles.dataStats}>
              <View style={styles.dataStat}>
                <Text style={styles.dataNumber}>{localDataStats.rounds}</Text>
                <Text style={styles.dataLabel}>Rounds</Text>
              </View>
              <View style={styles.dataStat}>
                <Text style={styles.dataNumber}>{localDataStats.shots}</Text>
                <Text style={styles.dataLabel}>Shots</Text>
              </View>
              <View style={styles.dataStat}>
                <Text style={styles.dataNumber}>{localDataStats.games}</Text>
                <Text style={styles.dataLabel}>Games</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Your Online Account</Text>
          <Text style={styles.formSubtitle}>
            Username: <Text style={styles.username}>{user?.username}</Text>
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password && styles.inputError]}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              editable={!loading}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleConvert}
            disabled={loading}
          >
            {loading ? (
              <View>
                <ActivityIndicator color="white" />
                {conversionProgress && (
                  <Text style={styles.progressText}>{conversionProgress.message}</Text>
                )}
              </View>
            ) : (
              <Text style={styles.buttonText}>Convert & Upload Data</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your local data will remain safe until the conversion is complete
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefit: {
    fontSize: 15,
    color: '#1B5E20',
    marginVertical: 2,
  },
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dataStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dataStat: {
    alignItems: 'center',
  },
  dataNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  username: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#81c784',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});

export default ConvertAccountScreen;