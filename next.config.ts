import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      // 🌐 Producción (Supabase en la nube)
      {
        protocol: "https",
        hostname: "sdtoftiqytveugixeliv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // 🧩 Supabase local (CLI o Docker)
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321", // si usas `supabase start`, cambia a "5432" si tu backend local lo sirve ahí
        pathname: "/storage/v1/object/public/**",
      },
      // 🔄 Opción de fallback (útil si pruebas archivos servidos directamente desde tu API local)
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5432",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // 🧠 Opcional: variables automáticas por entorno
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NODE_ENV === "production"
        ? "https://sdtoftiqytveugixeliv.supabase.co"
        : "http://localhost:54321",
  },
};

export default withPWA(nextConfig);
