// utils/storage.ts

interface AuthUser {
  id: string;
  nombre_completo: string;
  rol: string;
  email?: string;
}

interface Sucursal {
  id: string;
  nombre: string;
}

interface AuthState {
  state: {
    user: AuthUser | null;
    token: string;
    isLoading: boolean;
    isOnline: boolean;
    sucursal?: Sucursal;
  };
  version: number;
}

export const AUTH_STORAGE_KEY = "auth-storage";
export const SUCURSAL_STORAGE_KEY = "sucursal-actual";

/**
 * Valida la estructura del estado de autenticación
 */
function validateAuthState(authData: any): authData is AuthState {
  return (
    authData &&
    typeof authData === 'object' &&
    authData.state &&
    typeof authData.state === 'object' &&
    (authData.state.user === null || (
      authData.state.user &&
      typeof authData.state.user === 'object' &&
      authData.state.user.id &&
      authData.state.user.nombre_completo &&
      authData.state.user.rol
    )) &&
    typeof authData.state.token === 'string' &&
    typeof authData.state.isLoading === 'boolean' &&
    typeof authData.state.isOnline === 'boolean'
  );
}

/**
 * Valida la estructura de una sucursal
 */
function validateSucursal(sucursal: any): sucursal is Sucursal {
  return (
    sucursal &&
    typeof sucursal === 'object' &&
    typeof sucursal.id === 'string' &&
    sucursal.id.length > 0 &&
    typeof sucursal.nombre === 'string' &&
    sucursal.nombre.length > 0
  );
}

/**
 * Obtiene y valida el estado de autenticación del localStorage
 */
export function getAuthState(): AuthState | null {
  try {
    const authStorage = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authStorage) {
      return null;
    }

    let authData: any;
    try {
      authData = JSON.parse(authStorage);
    } catch (parseError) {
      console.error("Error al parsear auth-storage:", parseError);
      clearAuthStorage();
      return null;
    }

    if (!validateAuthState(authData)) {
      console.error("Estructura de auth-storage inválida");
      clearAuthStorage();
      return null;
    }

    return authData;
  } catch (error) {
    console.error("Error al obtener estado de autenticación:", error);
    clearAuthStorage();
    return null;
  }
}

/**
 * Guarda el estado de autenticación en localStorage de forma segura
 */
export function setAuthState(authState: AuthState): boolean {
  try {
    if (!validateAuthState(authState)) {
      console.error("Estado de autenticación inválido para guardar");
      return false;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    return true;
  } catch (error) {
    console.error("Error al guardar estado de autenticación:", error);
    return false;
  }
}

/**
 * Obtiene y valida la sucursal actual del localStorage
 */
export function getSucursalActual(): Sucursal | null {
  try {
    const sucursalStorage = localStorage.getItem(SUCURSAL_STORAGE_KEY);
    if (!sucursalStorage) {
      return null;
    }

    let sucursalData: any;
    try {
      sucursalData = JSON.parse(sucursalStorage);
    } catch (parseError) {
      console.error("Error al parsear sucursal-actual:", parseError);
      localStorage.removeItem(SUCURSAL_STORAGE_KEY);
      return null;
    }

    if (!validateSucursal(sucursalData)) {
      console.error("Estructura de sucursal-actual inválida");
      localStorage.removeItem(SUCURSAL_STORAGE_KEY);
      return null;
    }

    return sucursalData;
  } catch (error) {
    console.error("Error al obtener sucursal actual:", error);
    localStorage.removeItem(SUCURSAL_STORAGE_KEY);
    return null;
  }
}

/**
 * Guarda la sucursal actual en localStorage de forma segura
 */
export function setSucursalActual(sucursal: Sucursal): boolean {
  try {
    if (!validateSucursal(sucursal)) {
      console.error("Datos de sucursal inválidos para guardar");
      return false;
    }

    localStorage.setItem(SUCURSAL_STORAGE_KEY, JSON.stringify(sucursal));
    return true;
  } catch (error) {
    console.error("Error al guardar sucursal actual:", error);
    return false;
  }
}

/**
 * Actualiza la sucursal en el estado de autenticación
 */
export function updateSucursalInAuthState(sucursal: Sucursal): boolean {
  const authState = getAuthState();
  if (!authState) {
    console.error("No hay estado de autenticación para actualizar");
    return false;
  }

  authState.state.sucursal = sucursal;
  authState.version = (authState.version || 0) + 1;

  return setAuthState(authState) && setSucursalActual(sucursal);
}

/**
 * Elimina la sucursal del estado de autenticación
 */
export function removeSucursalFromAuthState(): boolean {
  const authState = getAuthState();
  if (!authState) {
    console.error("No hay estado de autenticación para actualizar");
    return false;
  }

  delete authState.state.sucursal;
  authState.version = (authState.version || 0) + 1;

  localStorage.removeItem(SUCURSAL_STORAGE_KEY);
  return setAuthState(authState);
}

/**
 * Limpia completamente el localStorage de autenticación
 */
export function clearAuthStorage(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(SUCURSAL_STORAGE_KEY);
  } catch (error) {
    console.error("Error al limpiar localStorage de autenticación:", error);
  }
}

/**
 * Verifica si hay una sesión válida de autenticación
 */
export function hasValidAuthSession(): boolean {
  const authState = getAuthState();
  return !!(
    authState &&
    authState.state.token &&
    authState.state.user &&
    authState.state.user.id &&
    authState.state.user.nombre_completo &&
    authState.state.user.rol
  );
}

/**
 * Obtiene la sucursal desde el estado de autenticación o sucursal-actual
 */
export function getCurrentSucursal(): Sucursal | null {
  // Primero intentar desde auth-storage
  const authState = getAuthState();
  if (authState && authState.state.sucursal && validateSucursal(authState.state.sucursal)) {
    return authState.state.sucursal;
  }

  // Si no está en auth-storage, intentar desde sucursal-actual
  return getSucursalActual();
}