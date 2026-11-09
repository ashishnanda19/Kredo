import type { NextConfig } from "next";

/**
 * The deployed site is the landing page and the legal pages only; the product runs in the mobile app. The student, vendor and
 * ops screens, sign-in and verification stay in the code for local work: they are on under `next dev`, and off in a production
 * build unless NEXT_PUBLIC_DEMO_CONTROLS=true. Same rule as lib/demo-flag.ts, repeated here because the config cannot import it.
 */
const flag = process.env.NEXT_PUBLIC_DEMO_CONTROLS;
const appRoutes = flag === "true" || (flag !== "false" && process.env.NODE_ENV !== "production");

const APP_PAGES = ["/dashboard/:path*", "/vendor/:path*", "/ops/:path*", "/demo/:path*", "/verify/:path*", "/start", "/login", "/signup", "/recover"];
const APP_APIS = ["/api/score/:path*", "/api/ops/:path*"];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return appRoutes ? [] : APP_PAGES.map((source) => ({ source, destination: "/", permanent: false }));
  },
  async rewrites() {
    // an unknown path, so these answer 404 instead of reaching the handlers
    return appRoutes ? [] : { beforeFiles: APP_APIS.map((source) => ({ source, destination: "/__not-found" })), afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
