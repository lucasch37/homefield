import { extract } from './extraction';
// Programmatically injected only after a user click; no listeners or network requests.
(globalThis as typeof globalThis & { __homeHazardExtraction?: unknown }).__homeHazardExtraction = extract(document, location.href);
