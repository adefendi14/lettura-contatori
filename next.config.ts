import type { NextConfig } from "next";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages ? { output: "export" } : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGithubPages
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/sw.js",
              headers: [
                {
                  key: "Cache-Control",
                  value: "no-cache, no-store, must-revalidate",
                },
                {
                  key: "Service-Worker-Allowed",
                  value: "/",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
