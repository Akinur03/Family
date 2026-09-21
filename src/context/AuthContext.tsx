import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, authStorage } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (params: {
    username: string;
    password: string;
    fullName: string;
    relationship: string;
  }) => Promise<{ message: string; isPending: boolean }>;
  logout: () => void;
  switchDemoUser: (username: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authStorage.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const token = authStorage.getToken();
        if (token) {
          const currentUser = await api.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            authStorage.clear();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to init auth', err);
        authStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    setUser(res.user);
  };

  const register = async (params: {
    username: string;
    password: string;
    fullName: string;
    relationship: string;
  }) => {
    const res = await api.register(params);
    if (res.user && res.user.status === 'active') {
      setUser(res.user);
    }
    return { message: res.message, isPending: res.isPending };
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
  };

  const switchDemoUser = async (username: string) => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoUser(username);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const currentUser = await api.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        switchDemoUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
