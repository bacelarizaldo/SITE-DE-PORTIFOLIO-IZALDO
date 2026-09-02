import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita o Next.js confundir a raiz do projeto quando existe outro
  // package-lock.json na pasta acima (SITE DE PORTIFOLIO IZALDO).
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.prismic.io",
      },
    ],
  },
};

export default nextConfig;
