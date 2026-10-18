import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// Next.js reads client/.env*. Teams often put the xAI key in the repository root instead, so also
// read XAI_* and BACKEND_URL from ../.env.local and ../.env. Values already set always win.
for (const file of ["../.env.local", "../.env"]) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?(XAI_[A-Z_]+|BACKEND_URL)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || process.env[match[1]]) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    if (value) process.env[match[1]] = value;
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
