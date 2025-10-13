"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasHydrated, user } = useAuth();

  useEffect(() => {
    // Espera a que el estado de autenticación esté listo
    if (!hasHydrated || isLoading) return;

    // Si no está autenticado, redirige al login
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Redirige según el rol del usuario
    const roleRedirects = {
      ADMINISTRADOR: "/pos",
      MESERO: "/mesero",
    } as const;

    console.log(user);

    const redirectPath =
      roleRedirects[user?.rol as keyof typeof roleRedirects] || "/dashboard";
    router.push(redirectPath);
  }, [isAuthenticated, isLoading, hasHydrated, user, router]);

  // Estado de carga: muestra spinner
  if (!hasHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Durante la redirección, muestra el mismo spinner
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900" />
          <p className="text-sm text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Usuario no autenticado: muestra el layout con el formulario de login
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Contenido del formulario de autenticación */}
      {children}

      {/* Panel lateral con imagen de fondo - solo visible en desktop */}
      <div
        className="hidden lg:flex relative bg-cover bg-center bg-no-repeat items-center justify-center"
        style={{
          backgroundImage: "url(/auth-bg.avif)",
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-black/20" />
        <Image
          width={400}
          height={400}
          src="/logo.png"
          alt="Logo Ricuras del Huila"
          className="relative z-10 max-w-md drop-shadow-2xl"
          priority
        />
      </div>
    </div>
  );
}
