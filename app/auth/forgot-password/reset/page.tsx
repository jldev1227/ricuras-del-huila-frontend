"use client";

import { Button } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    // Verificar que venimos del paso anterior
    const token = sessionStorage.getItem("reset_token");
    if (!token) {
      router.push("/forgot-password");
      return;
    }
    setResetToken(token);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== verifyPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar contraseña");
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem("reset_identificacion");
      sessionStorage.removeItem("reset_token");

      // Redirigir al login con mensaje de éxito
      alert("Contraseña actualizada exitosamente. Por favor inicia sesión.");
      router.push("/auth/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar contraseña",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="block lg:hidden">
          <Image
            width={224}
            height={224}          
            src="/logo.png"
            alt="Logo Ricuras del Huila"
            className="mx-auto relative z-10 w-56 h-56"
            loading="eager"
          />
        </div>

        <div className="flex items-center gap-2 mb-8">
          <Button isIconOnly color="primary" as={Link} href="/auth/login">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
              aria-label="Volver"
              role="img"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </Button>
          <p className="text-2xl font-bold text-foreground-700">Volver</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl font-black text-foreground-700 leading-[40px] sm:leading-[55px] sm:w-[30rem]">
              Crear nueva <span className="text-primary">Contraseña</span>
            </h1>
            <p className="text-sm text-gray-600 mt-4">
              Escribe y confirma una nueva contraseña segura para acceder
              nuevamente al sistema.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nueva contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-primary disabled:bg-gray-100"
                placeholder="Mínimo 6 caracteres"
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label
                htmlFor="verifyPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmar Contraseña
              </label>
              <input
                id="verifyPassword"
                type="password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-primary disabled:bg-gray-100"
                placeholder="Repite la contraseña"
              />
            </div>

            <div>
              <Button
                type="submit"
                color="primary"
                variant="solid"
                className="h-16 font-bold text-xl"
                size="md"
                fullWidth
                isLoading={loading}
                isDisabled={loading}
              >
                {loading ? "Actualizando..." : "Restablecer contraseña"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
