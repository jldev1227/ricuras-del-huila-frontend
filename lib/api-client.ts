// lib/api-client.ts
import { useAuthStore } from '@/hooks/useAuth';

/**
 * Cliente HTTP que automáticamente incluye el token de autenticación
 */
export class ApiClient {
  private static getAuthHeaders(): HeadersInit {
    const { token } = useAuthStore.getState();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static async fetch(
    url: string | URL | Request,
    options: RequestInit = {}
  ): Promise<Response> {
    const authHeaders = ApiClient.getAuthHeaders();
    
    // No incluir Content-Type si el body es FormData (para uploads de archivos)
    const isFormData = options.body instanceof FormData;
    
    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...authHeaders,
        ...options.headers,
      },
    };

    return fetch(url, mergedOptions);
  }

  static async get(url: string | URL | Request, options: RequestInit = {}): Promise<Response> {
    return ApiClient.fetch(url, { ...options, method: 'GET' });
  }

  static async post(
    url: string | URL | Request,
    data?: Record<string, unknown> | string | FormData,
    options: RequestInit = {}
  ): Promise<Response> {
    const body = data instanceof FormData ? data : 
                 typeof data === 'string' ? data : 
                 data ? JSON.stringify(data) : undefined;
                 
    return ApiClient.fetch(url, {
      ...options,
      method: 'POST',
      body,
    });
  }

  static async put(
    url: string | URL | Request,
    data?: Record<string, unknown> | string | FormData,
    options: RequestInit = {}
  ): Promise<Response> {
    const body = data instanceof FormData ? data : 
                 typeof data === 'string' ? data : 
                 data ? JSON.stringify(data) : undefined;
                 
    return ApiClient.fetch(url, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  static async patch(
    url: string | URL | Request,
    data?: Record<string, unknown> | string | FormData,
    options: RequestInit = {}
  ): Promise<Response> {
    const body = data instanceof FormData ? data : 
                 typeof data === 'string' ? data : 
                 data ? JSON.stringify(data) : undefined;
                 
    return ApiClient.fetch(url, {
      ...options,
      method: 'PATCH',
      body,
    });
  }

  static async delete(url: string | URL | Request, options: RequestInit = {}): Promise<Response> {
    return ApiClient.fetch(url, { ...options, method: 'DELETE' });
  }
}

/**
 * Hook para realizar peticiones autenticadas
 */
export function useAuthenticatedFetch() {
  const store = useAuthStore();

  const authenticatedFetch = async (
    url: string | URL | Request,
    options: RequestInit = {}
  ): Promise<Response> => {
    // Esperar a que el store se hidrate si es necesario
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!store._hasHydrated && attempts < maxAttempts) {
      console.log(`⏳ [api-client] Esperando hidratación... intento ${attempts + 1}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const { token } = store;
    
    // No incluir Content-Type si el body es FormData (para uploads de archivos)
    const isFormData = options.body instanceof FormData;
    
    console.log('🔐 [api-client] useAuthenticatedFetch llamado:', {
      url: url.toString(),
      method: options.method || 'GET',
      hasToken: !!token,
      tokenLength: token?.length || 0,
      isFormData,
      bodyType: options.body?.constructor.name,
      hydrated: store._hasHydrated
    })
    
    const headers: Record<string, string> = {};
    
    // Solo agregar Content-Type si no es FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('✅ [api-client] Token agregado al header')
    } else {
      console.log('❌ [api-client] No hay token disponible')
    }

    // Agregar headers adicionales de las opciones
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    const mergedOptions: RequestInit = {
      ...options,
      headers,
    };

    return fetch(url, mergedOptions);
  };

  return authenticatedFetch;
}