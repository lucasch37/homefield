import { defineConfig } from 'vitest/config';
export default defineConfig({ build: { rollupOptions: { input: 'sidepanel.html' } }, test: { environment: 'jsdom' } });
