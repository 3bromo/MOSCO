import type { NextConfig } from "next";

/**
 * Supabase storage host is derived from the public env var when present so that
 * <Image> keeps working for uploaded product photography in Supabase mode.
 */
const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // The Arena/e2b preview proxies the dev server under https://{port}-{id}.e2b.app
  allowedDevOrigins: ["*.e2b.app", "*.vercel.app"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
