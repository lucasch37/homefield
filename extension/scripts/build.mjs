import { build, loadEnv } from 'vite';
import { writeFile } from 'node:fs/promises';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const base = env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const origins = [...new Set([base, ...(env.VITE_API_ALLOWED_ORIGINS || '').split(',').filter(Boolean)].map(value => {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Backend must be an HTTP(S) URL without credentials, query, or fragment.');
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Remote backends require HTTPS.');
  return url.origin;
}))];
await build({ define: { __API_BASE__: JSON.stringify(base), __API_ORIGINS__: JSON.stringify(origins) } });
for (const entry of ['background', 'content']) {
  await build({ configFile: false, build: { emptyOutDir: false, rollupOptions: { output: { footer: entry === 'content' ? 'globalThis.__homeHazardExtraction;' : '' } }, lib: { entry: `src/${entry}.ts`, name: entry, formats: ['iife'], fileName: () => `${entry}.js` } } });
}
await writeFile('dist/manifest.json', JSON.stringify({
  manifest_version: 3, name: 'homefield.', version: '0.1.0', minimum_chrome_version: '116',
  description: 'Satellite observations for King County listings on Zillow and Redfin.',
  permissions: ['activeTab', 'scripting', 'sidePanel', 'storage'],
  host_permissions: origins.map(origin => `${new URL(origin).protocol}//${new URL(origin).hostname}/*`),
  action: { default_title: 'Open homefield.' },
  background: { service_worker: 'background.js' }, side_panel: { default_path: 'sidepanel.html' },
  content_security_policy: { extension_pages: "script-src 'self'; object-src 'none'; base-uri 'none'" }
}, null, 2));
