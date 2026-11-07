import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Self-contained server bundle for Docker (ignored on Vercel).
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Guides are read from disk at runtime by ISR pages; include them in traced output.
  outputFileTracingIncludes: { "/**": ["./content/**/*"] },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
