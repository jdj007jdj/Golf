/**
 * @file services/auth/AuthProvider.tsx
 * @description Authentication provider component
 */

import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { loadUserFromStorage } from '@/store/slices/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Load user from storage on app start
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  return <>{children}</>;
};