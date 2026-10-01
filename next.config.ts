import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { baseSecurityHeaders } from "./src/server/security/headers";

function storageRemotePattern() {
  try {
    const url = new URL(process.env.STORAGE_PUBLIC_URL ?? "");
    return {
      hostname: url.hostname,
      pathname: `${url.pathname.replace(/\/$/, "")}/**`,
      port: url.port,
      protocol: url.protocol.replace(":", "") as "http" | "https",
    };
  } catch {
    return null;
  }
}

const remotePattern = storageRemotePattern();

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io", pathname: "/**" },
      { protocol: "https", hostname: "uploadthing.com", pathname: "/**" },
      ...(remotePattern ? [remotePattern] : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: [...baseSecurityHeaders] }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
