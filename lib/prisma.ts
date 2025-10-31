import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuración optimizada para serverless
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Logs mínimos en producción
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
    errorFormat: process.env.NODE_ENV === "development" ? "pretty" : "minimal",
  });

// Event listeners SOLO en desarrollo
if (process.env.NODE_ENV === "development") {
  prisma.$on("query" as never, (e: any) => {
    console.log("📊 Query:", e.query, `(${e.duration}ms)`);
  });
}

// Singleton pattern para desarrollo
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ✅ CRÍTICO: Preparar conexión en serverless
if (process.env.VERCEL) {
  prisma.$connect().catch((err) => {
    console.error("Error conectando Prisma:", err);
  });
}

// ✅ CRÍTICO: Helper para verificar conexión bajo demanda
export async function verificarConexionDB() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true };
  } catch (error) {
    console.error("Error de conexión DB:", error);
    return { success: false, error };
  }
}

// ❌ NO ejecutar automáticamente en producción
// La verificación debe ser manual o por health check