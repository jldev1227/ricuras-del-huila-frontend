import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ Configuración optimizada para Vercel Serverless + Supabase
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
    errorFormat: process.env.NODE_ENV === "development" ? "pretty" : "minimal",
  });
};

// Singleton pattern para evitar múltiples instancias
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Event listeners SOLO en desarrollo
if (process.env.NODE_ENV === "development") {
  prisma.$on("query" as never, (e: any) => {
    console.log("📊 Query:", e.query, `(${e.duration}ms)`);
  });
}

// Guardar instancia en global para desarrollo (hot reload)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ✅ IMPORTANTE: Cerrar conexiones al finalizar (desarrollo)
if (process.env.NODE_ENV === "development") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

// ✅ Helper para verificar conexión de base de datos
export async function verificarConexionDB() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true };
  } catch (error) {
    console.error("❌ Error de conexión DB:", error);
    return { success: false, error };
  }
}