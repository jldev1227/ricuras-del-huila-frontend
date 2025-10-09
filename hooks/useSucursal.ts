// hooks/useSucursal.ts

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Sucursal {
  id: string;
  nombre: string;
}

interface AuthState {
  state: {
    user: any;
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
          const authData: AuthState = JSON.parse(authStorage);

          if (authData.state.sucursal) {
            setSucursal(authData.state.sucursal);
            setLoading(false);
            return;
          }
        }

        // Si no está en auth-storage, intentar cargar desde sucursal-actual
        const sucursalActual = localStorage.getItem("sucursal-actual");

        if (sucursalActual) {
          const sucursalData = JSON.parse(sucursalActual);
          setSucursal(sucursalData);
        } else {
          // Si no hay sucursal seleccionada, redirigir a la página de selección
          router.push("/");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar sucursal:", error);
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
        const authData: AuthState = JSON.parse(authStorage);
        delete authData.state.sucursal;
        authData.version = (authData.version || 0) + 1;
        localStorage.setItem("auth-storage", JSON.stringify(authData));
      }

      // Limpiar sucursal-actual
      localStorage.removeItem("sucursal-actual");

      // Redirigir a la selección de sucursal
      router.push("/");
    } catch (error) {
      console.error("Error al cambiar sucursal:", error);
    }
  };

  const actualizarSucursal = (nuevaSucursal: Sucursal) => {
    try {
      // Actualizar auth-storage
      const authStorage = localStorage.getItem("auth-storage");

      if (authStorage) {
        const authData: AuthState = JSON.parse(authStorage);
        authData.state.sucursal = nuevaSucursal;
        authData.version = (authData.version || 0) + 1;
        localStorage.setItem("auth-storage", JSON.stringify(authData));
      }

      // Actualizar sucursal-actual
      localStorage.setItem("sucursal-actual", JSON.stringify(nuevaSucursal));

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
