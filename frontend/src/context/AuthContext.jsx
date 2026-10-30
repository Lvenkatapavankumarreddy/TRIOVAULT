import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authApi.getSession();
      if (res.data?.authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    // Listen for custom 401 unauth events from api interceptor
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('vault:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('vault:unauthorized', handleUnauthorized);
  }, [checkSession]);

  const unlock = async (password) => {
    try {
      const res = await authApi.unlock(password);
      if (res.data?.success) {
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Unlock failed' };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        (error.response?.status === 429
          ? 'Too many unlock attempts. Please wait 15 minutes.'
          : 'Failed to verify password.');
      return { success: false, message: errorMsg };
    }
  };

  const lock = async () => {
    try {
      await authApi.lock();
    } catch (err) {
      console.warn('Error during lock request:', err);
    } finally {
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, unlock, lock, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
