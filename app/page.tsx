"use client";

import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { ArrowRight, LogOut, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Sucursal {
  id: string;
  nombre: string;
}

interface AuthUser {
  id: string;
  nombreCompleto: string;
  rol: string;
}

interface AuthState {
  state: {
    user: AuthUser | null;
    token: string;
    isLoading: boolean;
    isOnline: boolean;
    sucursal?: {
      id: string;
      nombre: string;
    };
  };
  version: number;
}

export default function Home() {
  const router = useRouter();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (!authStorage) {
          router.push("/auth/login");
          return;
        }

        const authData: AuthState = JSON.parse(authStorage);

        if (!authData.state.token || !authData.state.user) {
          return;
        }

        setAuthUser(authData.state.user);

        if (authData.state.sucursal) {
          router.push("/pos/ordenes");
          return;
        }

        // Solo si la autenticación es válida, cargar sucursales
        fetchSucursales();
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sucursales");
      const data = await response.json();
      if (data.success) {
        setSucursales(data.sucursales);
      }
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSucursal = (sucursal: Sucursal) => {
    setSelectedId(sucursal.id);

    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (!authStorage) return;

      const authData: AuthState = JSON.parse(authStorage);

      authData.state.sucursal = {
        id: sucursal.id,
        nombre: sucursal.nombre,
      };

      authData.version = (authData.version || 0) + 1;

      localStorage.setItem("auth-storage", JSON.stringify(authData));
      localStorage.setItem(
        "sucursal-actual",
        JSON.stringify({
          id: sucursal.id,
          nombre: sucursal.nombre,
        }),
      );

      setTimeout(() => {
        router.push("/pos/ordenes");
      }, 400);
    } catch (error) {
      console.error("Error al guardar sucursal:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-storage");
    localStorage.removeItem("sucursal-actual");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-accent/10 to-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Loading de autenticación */}
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" color="warning" />
            <p className="text-secondary mt-4">Verificando autenticación...</p>
          </div>
        ) : !authUser ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-6 rounded mb-8 text-center">
            <p className="font-semibold text-lg mb-2">Error de autenticación</p>
            <p className="text-sm mb-4">
              No se pudo verificar tu sesión. Por favor inicia sesión
              nuevamente.
            </p>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <LogOut size={16} />
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <>
            {/* Header con info de usuario */}
            {authUser && (
              <div className="flex justify-between items-center mb-8">
                <div className="text-left">
                  <p className="text-sm text-secondary">Bienvenido,</p>
                  <p className="text-lg font-semibold text-wine">
                    {authUser.nombreCompleto}
                  </p>
                  <p className="text-xs text-secondary">{authUser.rol}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-secondary hover:text-wine transition-colors"
                >
                  <LogOut size={16} />
                  Salir
                </button>
              </div>
            )}

            {/* Título principal */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-wine rounded-full mb-6 shadow-lg">
                <MapPin className="text-white" size={40} />
              </div>
              <h1 className="text-4xl font-bold text-wine mb-3">
                Selecciona tu sucursal
              </h1>
              <p className="text-secondary text-lg">
                Elige la sucursal desde donde operarás hoy
              </p>
            </div>

            {/* Loading de sucursales */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" color="warning" />
                <p className="text-secondary mt-4">Cargando sucursales...</p>
              </div>
            ) : sucursales.length === 0 ? (
              <Card className="shadow-lg">
                <CardBody className="text-center py-12">
                  <p className="text-secondary text-lg">
                    No hay sucursales disponibles
                  </p>
                  <p className="text-sm text-secondary mt-2">
                    Contacta al administrador del sistema
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sucursales.map((sucursal) => (
                  <Card
                    key={sucursal.id}
                    className={`
                      group relative overflow-hidden
                      rounded-2xl p-0 border-2 transition-all duration-300
                      ${selectedId === sucursal.id
                        ? "border-wine shadow-2xl scale-105"
                        : "border-transparent hover:border-primary hover:shadow-xl hover:scale-102"
                      }
                      ${selectedId && selectedId !== sucursal.id ? "opacity-50" : ""}
                    `}
                  >
                    <Button
                      type="button"
                      onClick={() => handleSelectSucursal(sucursal)}
                      disabled={selectedId !== null}
                      className={`
                        w-full h-full text-left bg-white rounded-2xl p-6 focus:outline-none
                        disabled:cursor-not-allowed
                        transition-colors duration-300
                      `}
                      aria-label={`Seleccionar sucursal ${sucursal.nombre}`}
                    >
                      {/* Efecto de fondo */}
                      <div
                        className={`
                          absolute inset-0 bg-gradient-to-br from-primary/5 to-wine/5 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          ${selectedId === sucursal.id ? "opacity-100" : ""}
                        `}
                      />

                      {/* Contenido */}
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`
                              w-12 h-12 rounded-full flex items-center justify-center
                              transition-colors duration-300
                              ${selectedId === sucursal.id
                                ? "bg-wine"
                                : "bg-primary/10 group-hover:bg-primary/20"
                              }
                            `}
                          >
                            <MapPin
                              className={`
                                transition-colors duration-300
                                ${selectedId === sucursal.id ? "text-white" : "text-primary"}
                              `}
                              size={24}
                            />
                          </div>
                          <div className="text-left">
                            <h3
                              className={`
                                font-semibold text-lg transition-colors duration-300
                                ${selectedId === sucursal.id
                                  ? "text-wine"
                                  : "text-gray-900 group-hover:text-wine"
                                }
                              `}
                            >
                              {sucursal.nombre}
                            </h3>
                            <p className="text-sm text-secondary">
                              {selectedId === sucursal.id
                                ? "Accediendo..."
                                : "Haz clic para seleccionar"}
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          className={`
                            transition-all duration-300
                            ${selectedId === sucursal.id
                              ? "text-wine translate-x-0"
                              : "text-secondary translate-x-0 group-hover:translate-x-1"
                            }
                          `}
                          size={24}
                        />
                      </div>
                      {/* Indicador de selección */}
                      {selectedId === sucursal.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 bg-wine rounded-full animate-pulse" />
                        </div>
                      )}
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-12">
              <p className="text-secondary text-sm">
                Podrás cambiar de sucursal desde la configuración del sistema
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
