import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import localAuthService from '../services/localAuthService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [accountType, setAccountType] = useState('online'); // 'local' or 'online'
  const [isLocalAccount, setIsLocalAccount] = useState(false);

  // Check for stored auth on app start
  useEffect(() => {
    initializeAuth();
  }, []);
  
  const initializeAuth = async () => {
    await localAuthService.initialize();
    await checkAuthStatus();
  };

  const checkAuthStatus = async () => {
    try {
      // First check for local account
      const localToken = await AsyncStorage.getItem('local_auth_token');
      const localUsername = await AsyncStorage.getItem('local_current_user');
      
      if (localToken && localUsername) {
        const userData = await localAuthService.getLocalUser(localUsername);
        if (userData) {
          setToken(localToken);
          setUser({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            accountType: 'local',
            stats: userData.stats
          });
          setAccountType('local');
          setIsLocalAccount(true);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      }
      
      // Check for online account
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        // Verify token is still valid by making a test request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for auth check
        
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.ME, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setAccountType('online');
          setIsLocalAccount(false);
          setIsAuthenticated(true);
        } else {
          // Token expired or invalid
          await logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🔐 Starting login request...');
    console.log('📍 API URL:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.LOGIN);
    console.log('📧 Email:', email);
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Response received:', response.status, response.statusText);
      console.log('📡 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (response.ok) {
        const { token: authToken, user: userData } = data.data;
        
        console.log('✅ Login successful, storing auth data...');
        console.log('🎫 Token received:', authToken ? 'yes' : 'no');
        console.log('👤 User data:', userData);
        
        // Store auth data
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        setToken(authToken);
        setUser(userData);
        setAccountType('online');
        setIsLocalAccount(false);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        console.log('❌ Login failed:', data.error?.message || 'Login failed');
        return { 
          success: false, 
          error: data.error?.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('❌ Network error details:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Network error. Please check your connection.';
      if (error.name === 'AbortError') {
        errorMessage = 'Login timed out. Please try again.';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const register = async (registrationData) => {
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Registration successful, but don't auto-login
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error?.message || 'Registration failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    }
  };

  const logout = async () => {
    try {
      if (isLocalAccount) {
        // Logout local account
        await localAuthService.logoutLocal();
      } else {
        // Clear online auth data
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      }
      
      setToken(null);
      setUser(null);
      setAccountType('online');
      setIsLocalAccount(false);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Login with local account
  const loginLocal = async (username, password) => {
    console.log('🔐 Starting local login...');
    
    const result = await localAuthService.authenticateLocal(username, password);
    
    if (result.success) {
      setToken(result.token);
      setUser(result.user);
      setAccountType('local');
      setIsLocalAccount(true);
      setIsAuthenticated(true);
    }
    
    return result;
  };
  
  // Create local account
  const createLocalAccount = async (username, password) => {
    console.log('📝 Creating local account...');
    
    const result = await localAuthService.createLocalUser(username, password);
    
    if (result.success) {
      // Auto-login after creation
      return await loginLocal(username, password);
    }
    
    return result;
  };
  
  // Convert local account to online
  const convertToOnline = async (email, password) => {
    console.log('🔄 Converting local account to online...');
    
    if (!isLocalAccount || !user) {
      return { success: false, error: 'No local account to convert' };
    }
    
    try {
      // Get local data for conversion
      const localData = await localAuthService.getLocalDataForConversion(user.username);
      if (!localData) {
        return { success: false, error: 'Failed to get local data' };
      }
      
      // Call backend API to create online account and start conversion
      const response = await fetch(API_CONFIG.BASE_URL + '/api/auth/convert-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          email,
          password,
          deviceId: localData.deviceId,
          localData: {
            rounds: localData.rounds.length,
            shots: localData.shots.length,
            games: localData.games.length
          }
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const { token: authToken, user: userData, conversionId } = data.data;
        
        // Update auth state to online
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        setToken(authToken);
        setUser(userData);
        setAccountType('online');
        setIsLocalAccount(false);
        
        // Queue local data for sync using existing services
        // This will be handled by the conversion service
        
        return { 
          success: true, 
          conversionId,
          localData
        };
      } else {
        return { 
          success: false, 
          error: data.error?.message || 'Conversion failed' 
        };
      }
    } catch (error) {
      console.error('❌ Conversion error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
      };
    }
  };

  const value = {
    isLoading,
    isAuthenticated,
    user,
    token,
    accountType,
    isLocalAccount,
    login,
    loginLocal,
    createLocalAccount,
    register,
    logout,
    convertToOnline,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;