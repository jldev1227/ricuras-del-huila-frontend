"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasHydrated, user } = useAuth();

  useEffect(() => {
    if (hasHydrated && !isLoading && isAuthenticated) {
      console.log("Redirigiendo a /pos...");
      router.push("/pos");
    }
  }, [isAuthenticated, isLoading, hasHydrated, router]);

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {children}
      <div
        className="hidden lg:flex relative bg-cover bg-center bg-no-repeat items-center justify-center"
        style={{
          backgroundImage: "url(/auth-bg.avif)",
        }}
      >
        <Image
          width={400}
          height={400}
          src="/logo.png"
          alt="Logo Ricuras del Huila"
          className="relative z-10 max-w-md"
          loading="eager"
        />
      </div>
    </div>
  );
}
