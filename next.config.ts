import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];

const privateRobots = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [...securityHeaders, { key: "X-Robots-Tag", value: "index, follow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }, ...securityHeaders],
      },
      { source: "/dashboard/:path*", headers: [...securityHeaders, ...privateRobots] },
      { source: "/finances/:path*", headers: [...securityHeaders, ...privateRobots] },
      { source: "/goals/:path*", headers: [...securityHeaders, ...privateRobots] },
      { source: "/ai/:path*", headers: [...securityHeaders, ...privateRobots] },
      { source: "/admin/:path*", headers: [...securityHeaders, ...privateRobots] },
      { source: "/auth/:path*", headers: [...securityHeaders, ...privateRobots] },
      { source: "/privacy/:path*", headers: securityHeaders },
      { source: "/terms/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
