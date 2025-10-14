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
    
    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
    return ApiClient.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put(
    url: string | URL | Request,
    data?: Record<string, unknown> | string | FormData,
    options: RequestInit = {}
  ): Promise<Response> {
    return ApiClient.fetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async patch(
    url: string | URL | Request,
    data?: Record<string, unknown> | string | FormData,
    options: RequestInit = {}
  ): Promise<Response> {
    return ApiClient.fetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
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
  const { token } = useAuthStore();

  const authenticatedFetch = async (
    url: string | URL | Request,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
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