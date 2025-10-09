"use client";

import { useState, useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: string;
  nombreCompleto: string;
  identificacion: string;
  rol: "ADMINISTRADOR" | "MESERO";
  correo?: string;
  telefono?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isOnline: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
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
      isOnline: typeof window !== "undefined" ? navigator.onLine : true,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: async (identificacion, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identificacion, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Error al iniciar sesión");
          }

          set({
            user: data.user,
            token: data.token,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
        }
        set({ user: null, token: null });
      },

      setOnlineStatus: (status) => {
        set({ isOnline: status });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // Excluir _hasHydrated de la persistencia
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isOnline: state.isOnline,
      }),
      onRehydrateStorage: () => (state) => {
        // Este callback se ejecuta DESPUÉS de cargar desde localStorage
        console.log("Rehidratando store...");
        if (state) {
          console.log("Estado rehidratado:", {
            user: state.user,
            token: state.token,
          });
          state.setHasHydrated(true);
        }
      },
    },
  ),
);

// Hook mejorado con debugging
export function useAuth() {
  const store = useAuthStore();
  const {
    user,
    token,
    isLoading,
    isOnline,
    _hasHydrated,
    login,
    logout,
    setOnlineStatus,
  } = store;

  // Debug en desarrollo
  useEffect(() => {
    console.log("Estado auth actualizado:", {
      hasUser: !!user,
      hasToken: !!token,
      hasHydrated: _hasHydrated,
      user: user,
    });
  }, [user, token, _hasHydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnlineStatus]);

  return {
    user,
    token,
    isLoading,
    isOnline,
    isAuthenticated: !!user,
    hasHydrated: _hasHydrated,
    login,
    logout,
  };
}

// Hook adicional para esperar la hidratación (opcional pero útil)
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Esperar a que Zustand se hidrate
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Si ya está hidratado, activar inmediatamente
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsubscribe;
  }, []);

  return hydrated;
}
