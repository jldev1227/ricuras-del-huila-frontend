'use client';

import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  nombreCompleto: string;
  identificacion: string;
  rol: 'ADMINISTRADOR' | 'MESERO';
  correo?: string;
  telefono?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isOnline: boolean;
  login: (identificacion: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,

      login: async (identificacion, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identificacion, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión');
          }

          set({ 
            user: data.user, 
            token: data.token,
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        }
        set({ user: null, token: null });
      },

      setOnlineStatus: (status) => {
        set({ isOnline: status });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Hook principal
export function useAuth() {
  const { user, token, isLoading, isOnline, login, logout, setOnlineStatus } = useAuthStore();

  if (typeof window !== 'undefined') {
    React.useEffect(() => {
      const handleOnline = () => setOnlineStatus(true);
      const handleOffline = () => setOnlineStatus(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, [setOnlineStatus]);
  }

  return {
    user,
    token,
    isLoading,
    isOnline,
    isAuthenticated: !!user,
    login,
    logout,
  };
}