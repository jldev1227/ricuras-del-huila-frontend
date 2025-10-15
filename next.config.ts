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
  // Tu config aquí
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'sdtoftiqytveugixeliv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
  },
};

export default withPWA(nextConfig);
