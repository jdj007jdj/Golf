import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

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

  // Check for stored auth on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        // Verify token is still valid by making a test request
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.ME, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });
        
        if (response.ok) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
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
      
      return { 
        success: false, 
        error: 'Network error. Please check your connection.' 
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
      // Clear stored auth data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    isLoading,
    isAuthenticated,
    user,
    token,
    login,
    register,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;