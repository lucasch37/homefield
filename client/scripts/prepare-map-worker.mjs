import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Serve MapLibre's worker directly: bundling its import.meta URL can break in Next.js.
const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve('maplibre-gl/package.json'));
const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));
await mkdir(publicDirectory, { recursive: true });
await copyFile(join(packageRoot, 'dist/maplibre-gl-worker.mjs'), join(publicDirectory, 'maplibre-worker.mjs'));
