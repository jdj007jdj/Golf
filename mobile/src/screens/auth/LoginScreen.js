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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login, loginLocal, createLocalAccount } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('online'); // 'online' or 'local'
  const [isCreatingLocal, setIsCreatingLocal] = useState(false);
  
  // Reset isCreatingLocal when mode changes
  React.useEffect(() => {
    setIsCreatingLocal(false);
  }, [mode]);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation for both online and local
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (forceCreateLocal = false) => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    console.log('🔐 handleLogin called with:', { mode, isCreatingLocal, forceCreateLocal });
    
    let result;
    if (mode === 'online') {
      result = await login(email, password);
    } else {
      if (forceCreateLocal || isCreatingLocal) {
        console.log('📝 Attempting to create local account');
        result = await createLocalAccount(email, password);
      } else {
        console.log('🔓 Attempting to login to local account');
        result = await loginLocal(email, password);
      }
    }
    
    if (!result.success) {
      if (mode === 'local' && !forceCreateLocal && !isCreatingLocal && result.error.includes('Invalid email or password')) {
        // Check if this is truly a non-existent account or just wrong password
        // For now, we'll keep the existing behavior but with clearer messaging
        Alert.alert(
          'Login Failed',
          'Invalid email or password. If you don\'t have a local account yet, you can create one.',
          [
            { text: 'Try Again', style: 'cancel' },
            { 
              text: 'Create New Account', 
              onPress: () => {
                setIsCreatingLocal(true);
                handleLogin(true); // Pass true to force create local account
              }
            }
          ]
        );
      } else if (result.error.includes('already exists')) {
        // This means they're trying to create an account that already exists
        Alert.alert(
          'Account Exists', 
          'A local account with this email already exists. Please login with your password.',
          [{ text: 'OK', onPress: () => setIsCreatingLocal(false) }]
        );
      } else {
        Alert.alert(isCreatingLocal ? 'Account Creation Failed' : 'Login Failed', result.error);
      }
    }
    // If successful, navigation will happen automatically via AuthContext
    
    setLoading(false);
    // Always reset isCreatingLocal after handling the result
    // The alert handlers will set it again if needed
    setIsCreatingLocal(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Golf Tracker</Text>
          <Text style={styles.subtitle}>
            {mode === 'online' ? 'Sign in to your account' : 'Play offline on this device'}
          </Text>
        </View>
        
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'online' && styles.modeButtonActive]}
            onPress={() => {
              setMode('online');
              setErrors({});
            }}
          >
            <Text style={[styles.modeButtonText, mode === 'online' && styles.modeButtonTextActive]}>
              Online Account
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'local' && styles.modeButtonActive]}
            onPress={() => {
              setMode('local');
              setErrors({});
              setIsCreatingLocal(false); // Ensure we start in login mode
            }}
          >
            <Text style={[styles.modeButtonText, mode === 'local' && styles.modeButtonTextActive]}>
              Play Offline
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
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
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
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

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'online' ? 'Sign In' : (isCreatingLocal ? 'Create Local Account' : 'Play Offline')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          {mode === 'online' ? (
            <>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.localInfo}>
              <Text style={styles.localInfoText}>🔒 Data stored locally on this device</Text>
              <Text style={styles.localInfoSubtext}>You can convert to an online account later</Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 30,
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
    color: '#000',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 30,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#2e7d32',
  },
  localInfo: {
    alignItems: 'center',
  },
  localInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  localInfoSubtext: {
    fontSize: 12,
    color: '#999',
  },
});

export default LoginScreen;