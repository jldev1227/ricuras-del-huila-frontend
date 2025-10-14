"use client";

import { Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Page() {
  const _router = useRouter();
  const { login, isOnline, error, clearError, isLoading } = useAuth();

  const [identificacion, setIdentificacion] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Limpiar errores previos usando el hook

    try {
      const response = await login(identificacion, password);
      const rol = response?.user?.rol;
      const isAdmin =
        typeof rol === "string" && rol.toUpperCase() === "ADMINISTRADOR";

      window.location.href = isAdmin ? "/pos" : "/mesero";
    } catch (err) {
      // El error ya está siendo manejado por el hook useAuth
      console.log("Error de login manejado por useAuth:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="block lg:hidden">
          <Image
            width={250}
            height={250}
            src="/logo.png"
            alt="Logo Ricuras del Huila"
            className="mx-auto relative z-10 w-56 h-56"
            loading="eager"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl font-black text-foreground-700 leading-[40px] sm:leading-[55px] sm:w-[30rem]">
              Acceso Interno{" "}
              <span className="text-primary">Ricuras Del Huila</span>
            </h1>
            <p className="text-sm text-gray-600 mt-4">
              Sistema exclusivo para el personal autorizado.
            </p>
          </div>

          {/* Indicador offline */}
          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              Modo Offline - Solo usuarios previamente autenticados
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error.message}
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-5">
            {/* Identificación */}
            <div>
              <label
                htmlFor="identificacion"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Identificación
              </label>
              <input
                id="identificacion"
                type="number"
                value={identificacion}
                onChange={(e) => {
                  setIdentificacion(e.target.value);
                }}
                required
                disabled={isLoading}
                className="text-black w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-primary disabled:bg-gray-100"
                placeholder="Ej: 1234567890"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                required
                disabled={isLoading}
                className="text-black w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-primary disabled:bg-gray-100"
                placeholder="••••••••"
              />
            </div>

            {/* Submit button */}
            <div>
              <Button
                type="submit"
                color="primary"
                variant="solid"
                className="h-16 font-bold text-xl"
                size="md"
                fullWidth
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </div>

            <p className="text-center font-bold text-foreground-700">
              ¿Olvidaste tu contraseña?{" "}
              <Link href={"/auth/forgot-password"} className="text-primary">
                Recuperar contraseña
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
