// hooks/useSucursal.ts

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Sucursal {
  id: string;
  nombre: string;
}

interface AuthState {
  state: {
    user: {
      id: string;
      nombre_completo: string;
      rol: string;
      email?: string;
    };
    token: string;
    isLoading: boolean;
    isOnline: boolean;
    sucursal?: Sucursal;
  };
  version: number;
}

export function useSucursal() {
  const router = useRouter();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSucursal = () => {
      try {
        // Intentar cargar desde auth-storage primero
        const authStorage = localStorage.getItem("auth-storage");

        if (authStorage) {
          let authData: AuthState;
          
          try {
            authData = JSON.parse(authStorage);
          } catch (parseError) {
            console.error("Error al parsear auth-storage en useSucursal:", parseError);
            // Limpiar localStorage corrupto
            localStorage.removeItem("auth-storage");
            localStorage.removeItem("sucursal-actual");
            router.push("/auth/login");
            setLoading(false);
            return;
          }

          // Validar estructura del estado
          if (authData && authData.state && authData.state.sucursal && 
              authData.state.sucursal.id && authData.state.sucursal.nombre) {
            setSucursal(authData.state.sucursal);
            setLoading(false);
            return;
          }
        }

        // Si no está en auth-storage, intentar cargar desde sucursal-actual
        const sucursalActual = localStorage.getItem("sucursal-actual");

        if (sucursalActual) {
          try {
            const sucursalData = JSON.parse(sucursalActual);
            
            // Validar estructura de sucursal
            if (sucursalData && sucursalData.id && sucursalData.nombre) {
              setSucursal(sucursalData);
            } else {
              console.error("Estructura de sucursal-actual inválida");
              localStorage.removeItem("sucursal-actual");
              router.push("/");
            }
          } catch (parseError) {
            console.error("Error al parsear sucursal-actual:", parseError);
            localStorage.removeItem("sucursal-actual");
            router.push("/");
          }
        } else {
          // Si no hay sucursal seleccionada, redirigir a la página de selección
          router.push("/");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar sucursal:", error);
        // En caso de error inesperado, limpiar y redirigir
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("sucursal-actual");
        router.push("/auth/login");
        setLoading(false);
      }
    };

    loadSucursal();
  }, [router]);

  const cambiarSucursal = () => {
    try {
      // Limpiar la sucursal del auth-storage
      const authStorage = localStorage.getItem("auth-storage");

      if (authStorage) {
        try {
          const authData: AuthState = JSON.parse(authStorage);
          
          // Validar estructura antes de modificar
          if (authData && authData.state && typeof authData.state === 'object') {
            delete authData.state.sucursal;
            authData.version = (authData.version || 0) + 1;
            localStorage.setItem("auth-storage", JSON.stringify(authData));
          } else {
            console.error("Estructura de auth-storage inválida en cambiarSucursal");
            localStorage.removeItem("auth-storage");
          }
        } catch (parseError) {
          console.error("Error al parsear auth-storage en cambiarSucursal:", parseError);
          localStorage.removeItem("auth-storage");
        }
      }

      // Limpiar sucursal-actual
      localStorage.removeItem("sucursal-actual");

      // Redirigir a la selección de sucursal
      router.push("/");
    } catch (error) {
      console.error("Error al cambiar sucursal:", error);
      // En caso de error, forzar limpieza y redirección
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("sucursal-actual");
      router.push("/auth/login");
    }
  };

  const actualizarSucursal = (nuevaSucursal: Sucursal) => {
    try {
      // Validar datos de entrada
      if (!nuevaSucursal || !nuevaSucursal.id || !nuevaSucursal.nombre) {
        console.error("Datos de sucursal inválidos en actualizarSucursal");
        return;
      }

      // Actualizar auth-storage
      const authStorage = localStorage.getItem("auth-storage");

      if (authStorage) {
        try {
          const authData: AuthState = JSON.parse(authStorage);
          
          // Validar estructura antes de modificar
          if (authData && authData.state && typeof authData.state === 'object') {
            authData.state.sucursal = nuevaSucursal;
            authData.version = (authData.version || 0) + 1;
            localStorage.setItem("auth-storage", JSON.stringify(authData));
          } else {
            console.error("Estructura de auth-storage inválida en actualizarSucursal");
            localStorage.removeItem("auth-storage");
          }
        } catch (parseError) {
          console.error("Error al parsear auth-storage en actualizarSucursal:", parseError);
          localStorage.removeItem("auth-storage");
        }
      }

      // Actualizar sucursal-actual
      try {
        localStorage.setItem("sucursal-actual", JSON.stringify(nuevaSucursal));
      } catch (storageError) {
        console.error("Error al guardar sucursal-actual:", storageError);
        // Continuar sin persistir si hay error de almacenamiento
      }

      // Actualizar estado local
      setSucursal(nuevaSucursal);
    } catch (error) {
      console.error("Error al actualizar sucursal:", error);
    }
  };

  return {
    sucursal,
    loading,
    cambiarSucursal,
    actualizarSucursal,
    sucursalId: sucursal?.id || null,
    sucursalNombre: sucursal?.nombre || null,
  };
}
