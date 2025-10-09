// app/providers.tsx
"use client";

import { ToastProvider } from "@heroui/react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ToastProvider placement="bottom-center" />
      {children}
    </HeroUIProvider>
  );
}
