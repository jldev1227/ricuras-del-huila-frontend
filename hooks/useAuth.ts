"use client";

import { useEffect, useState, useCallback } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ============================================================================
// TYPES
// ============================================================================

type UserRole = "ADMINISTRADOR" | "MESERO";

interface User {
  id: string;
  nombre_completo: string;
  identificacion: string;
  rol: UserRole;
  correo?: string;
  telefono?: string;
}

interface LoginResponse {
  user: User;
  token: string;
  message?: string;
}

interface AuthError {
  message: string;
  code?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isOnline: boolean;
  error: AuthError | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (identificacion: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  clearError: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_STORAGE_KEY = "auth-storage";
const LOGIN_ENDPOINT = "/api/auth/login";
const LOGOUT_ENDPOINT = "/api/auth/logout";
const REQUEST_TIMEOUT = 10000; // 10 segundos

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Valida las credenciales antes de enviarlas
 */
function validateCredentials(identificacion: string, password: string): void {
  if (!identificacion?.trim()) {
    throw new Error("La identificación es requerida");
  }
  if (!password?.trim()) {
    throw new Error("La contraseña es requerida");
  }
  if (password.length < 4) {
    throw new Error("La contraseña debe tener al menos 4 caracteres");
  }
}

/**
 * Fetch con timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado tiempo");
    }
    throw error;
  }
}

/**
 * Logger condicional (solo en desarrollo)
 */
const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[Auth]", ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[Auth Error]", ...args);
    }
  },
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isOnline: typeof window !== "undefined" ? navigator.onLine : true,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: async (identificacion, password) => {
        // Limpiar errores previos
        set({ isLoading: true, error: null });

        try {
          // Validar credenciales
          validateCredentials(identificacion, password);

          // Realizar petición de login
          const response = await fetchWithTimeout(LOGIN_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identificacion: identificacion.trim(),
              password,
            }),
          });

          const data: LoginResponse = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Error al iniciar sesión");
          }

          // Validar respuesta del servidor
          if (!data.user || !data.token) {
            throw new Error("Respuesta del servidor inválida");
          }

          // Guardar datos de autenticación
          set({
            user: data.user,
            token: data.token,
            isLoading: false,
            error: null,
          });

          logger.log("Login exitoso:", data.user.nombre_completo);
          return data;
        } catch (error) {
          const authError: AuthError = {
            message:
              error instanceof Error
                ? error.message
                : "Error desconocido al iniciar sesión",
          };

          set({
            isLoading: false,
            error: authError,
            user: null,
            token: null,
          });

          logger.error("Error en login:", authError.message);
          throw authError;
        }
      },

      logout: async () => {
        const { token } = get();

        try {
          // Intentar cerrar sesión en el servidor
          if (token) {
            await fetchWithTimeout(
              LOGOUT_ENDPOINT,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
              5000, // Timeout más corto para logout
            );
          }
        } catch (error) {
          // No bloqueamos el logout local si falla el servidor
          logger.error("Error al cerrar sesión en el servidor:", error);
        } finally {
          // Siempre limpiar el estado local
          set({
            user: null,
            token: null,
            error: null,
            isLoading: false,
          });
          logger.log("Sesión cerrada");
        }
      },

      setOnlineStatus: (status) => {
        const currentStatus = get().isOnline;
        if (currentStatus !== status) {
          set({ isOnline: status });
          logger.log(
            "Estado de conexión:",
            status ? "En línea" : "Sin conexión",
          );
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isOnline: state.isOnline,
      }),
      onRehydrateStorage: () => (state) => {
        logger.log("Rehidratando store de autenticación...");
        if (state) {
          logger.log("Estado rehidratado:", {
            hasUser: !!state.user,
            hasToken: !!state.token,
            userName: state.user?.nombre_completo,
          });
          state.setHasHydrated(true);
        }
      },
    },
  ),
);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook principal de autenticación
 */
export function useAuth() {
  const {
    user,
    token,
    isLoading,
    isOnline,
    error,
    _hasHydrated,
    login,
    logout,
    setOnlineStatus,
    clearError,
  } = useAuthStore();

  // Monitorear el estado de conexión
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

  // Login mejorado con mejor tipado
  const handleLogin = useCallback(
    async (identificacion: string, password: string) => {
      try {
        return await login(identificacion, password);
      } catch (error) {
        // El error ya está en el store, solo lo propagamos
        throw error;
      }
    },
    [login],
  );

  return {
    // Estado
    user,
    token,
    isLoading,
    isOnline,
    error,
    isAuthenticated: !!user && !!token,
    hasHydrated: _hasHydrated,

    // Acciones
    login: handleLogin,
    logout,
    clearError,

    // Helpers
    hasRole: useCallback((role: UserRole) => user?.rol === role, [user?.rol]),
    isAdmin: user?.rol === "ADMINISTRADOR",
    isWaiter: user?.rol === "MESERO",
  };
}

/**
 * Hook para esperar la hidratación del store
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Verificar si ya está hidratado
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    // Suscribirse a la hidratación
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return unsubscribe;
  }, []);

  return hydrated;
}

/**
 * Hook para acceder solo al usuario (optimizado para evitar re-renders)
 */
export function useUser() {
  return useAuthStore((state) => state.user);
}

/**
 * Hook para acceder solo al token (optimizado para evitar re-renders)
 */
export function useToken() {
  return useAuthStore((state) => state.token);
}

/**
 * Hook para validar permisos por rol
 */
export function useRoleGuard(allowedRoles: UserRole[]) {
  const user = useUser();
  const hasPermission = user ? allowedRoles.includes(user.rol) : false;

  return {
    hasPermission,
    user,
    role: user?.rol,
  };
}
