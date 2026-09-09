import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  getAccessToken,
} from '../services/googleAuth';

interface GoogleSheetsContextType {
  isGoogleConnected: boolean;
  googleUser: FirebaseUser | null;
  googleAccessToken: string | null;
  isLoading: boolean;
  error: string | null;
  connectGoogle: () => Promise<string | null>;
  disconnectGoogle: () => Promise<void>;
  clearError: () => void;
}

const GoogleSheetsContext = createContext<GoogleSheetsContextType | undefined>(undefined);

export const GoogleSheetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        setIsLoading(false);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setIsLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const connectGoogle = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
        return result.accessToken;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to connect Google account:', err);
      setError(err?.message || 'Google authorization was cancelled or failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnectGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await googleLogout();
      setGoogleUser(null);
      setGoogleAccessToken(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to disconnect Google account:', err);
      setError(err?.message || 'Failed to sign out from Google');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <GoogleSheetsContext.Provider
      value={{
        isGoogleConnected: Boolean(googleAccessToken && googleUser),
        googleUser,
        googleAccessToken,
        isLoading,
        error,
        connectGoogle,
        disconnectGoogle,
        clearError,
      }}
    >
      {children}
    </GoogleSheetsContext.Provider>
  );
};

export function useGoogleSheets() {
  const context = useContext(GoogleSheetsContext);
  if (!context) {
    throw new Error('useGoogleSheets must be used within a GoogleSheetsProvider');
  }
  return context;
}
