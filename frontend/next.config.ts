import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Monorepo has lockfiles at repo root + frontend; pin Turbopack to this app.
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: turbopackRoot,
  },
};

export default nextConfig;
