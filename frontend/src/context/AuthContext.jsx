import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

// Auto-lock after 10 minutes of inactivity
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const idleTimerRef = useRef(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      // Auto lock on inactivity
      sessionStorage.removeItem('triovault_tab_unlocked');
      sessionStorage.removeItem('triovault_token');
      setIsAuthenticated(false);
      authApi.lock().catch(() => {});
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      // Require unlock per visit: if not unlocked in this active tab session, prompt for password
      const tabUnlocked = sessionStorage.getItem('triovault_tab_unlocked') === 'true';
      const token = sessionStorage.getItem('triovault_token');

      if (!tabUnlocked || !token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const res = await authApi.getSession();
      if (res.data?.authenticated) {
        setIsAuthenticated(true);
        resetIdleTimer();
      } else {
        sessionStorage.removeItem('triovault_tab_unlocked');
        sessionStorage.removeItem('triovault_token');
        setIsAuthenticated(false);
      }
    } catch (err) {
      sessionStorage.removeItem('triovault_tab_unlocked');
      sessionStorage.removeItem('triovault_token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [resetIdleTimer]);

  useEffect(() => {
    checkSession();

    // Listen for custom 401 unauth events from api interceptor
    const handleUnauthorized = () => {
      sessionStorage.removeItem('triovault_tab_unlocked');
      sessionStorage.removeItem('triovault_token');
      setIsAuthenticated(false);
    };

    window.addEventListener('vault:unauthorized', handleUnauthorized);

    // Track user activity to prevent premature lock while actively working
    const handleActivity = () => {
      if (sessionStorage.getItem('triovault_tab_unlocked') === 'true') {
        resetIdleTimer();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('vault:unauthorized', handleUnauthorized);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [checkSession, resetIdleTimer]);

  const unlock = async (password) => {
    try {
      const res = await authApi.unlock(password);
      if (res.data?.success) {
        sessionStorage.setItem('triovault_tab_unlocked', 'true');
        if (res.data.token) {
          sessionStorage.setItem('triovault_token', res.data.token);
        }
        setIsAuthenticated(true);
        resetIdleTimer();
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
    sessionStorage.removeItem('triovault_tab_unlocked');
    sessionStorage.removeItem('triovault_token');
    setIsAuthenticated(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    try {
      await authApi.lock();
    } catch (err) {
      console.warn('Error during lock request:', err);
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

