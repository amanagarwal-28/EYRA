import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ── Medusa backend ────────────────────────────────────────
      // Local development: Medusa serves uploads directly from its HTTP port.
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/uploads/**",
      },
      // Self-hosted Medusa on a custom domain (set NEXT_PUBLIC_MEDUSA_BACKEND_URL).
      // Replace "your-medusa-domain.com" with your actual production hostname,
      // or use a wildcard subdomain if deploying to a managed platform.
      {
        protocol: "https",
        hostname: "*.medusajs.com",
        pathname: "/**",
      },

      // ── Cloudinary CDN ────────────────────────────────────────
      // Used when Medusa's file plugin is configured to upload to Cloudinary.
      // All delivery subdomains (res, video, image) share this hostname.
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },

      // ── AWS S3 ────────────────────────────────────────────────
      // Virtual-hosted-style: <bucket>.s3.<region>.amazonaws.com
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      // Path-style (legacy): s3.amazonaws.com/<bucket>/...
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
        pathname: "/**",
      },

      // ── Supabase Storage ──────────────────────────────────────
      // Public bucket objects are served under /storage/v1/object/public/.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      // ── DigitalOcean Spaces ───────────────────────────────────
      // Spaces buckets are served from <bucket>.<region>.digitaloceanspaces.com.
      {
        protocol: "https",
        hostname: "*.digitaloceanspaces.com",
        pathname: "/**",
      },
    ],

    // Cache each optimized image for 24 hours on Vercel's CDN edge.
    // The default is 60 s; a higher value dramatically reduces the number of
    // re-optimization calls counted against Vercel's image transformation quota.
    minimumCacheTTL: 86400,

    // Generate AVIF first (40–60 % smaller than JPEG at equal quality),
    // then WebP as the fallback for browsers that don't support AVIF.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
