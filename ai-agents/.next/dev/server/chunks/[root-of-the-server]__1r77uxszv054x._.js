module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/app/api/hazards/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
// GET /api/hazards?address=...   or   /api/hazards?lat=...&lon=...
// Same-origin proxy to the team's FastAPI server (server/ on origin/master), so any King County address works
// for the page and for Grok Voice's get_hazards tool. Passes the server's status and JSON through unchanged.
// Set HAZARDS_API_URL in .env.local if the server isn't on http://localhost:8000.
const HAZARDS_API_URL = (process.env.HAZARDS_API_URL || "http://localhost:8000").replace(/\/$/, "");
async function GET(request) {
    const params = new URL(request.url).searchParams;
    const address = params.get("address")?.trim();
    const lat = params.get("lat"), lon = params.get("lon");
    const query = new URLSearchParams();
    if (address) query.set("address", address.slice(0, 500));
    else if (lat && lon) {
        query.set("lat", lat);
        query.set("lon", lon);
    } else return Response.json({
        detail: "Provide an address or both lat and lon."
    }, {
        status: 422
    });
    try {
        const res = await fetch(`${HAZARDS_API_URL}/hazards?${query}`, {
            headers: {
                Accept: "application/json"
            },
            cache: "no-store",
            signal: AbortSignal.timeout(12000)
        });
        const body = await res.json().catch(()=>({
                detail: "The hazards server sent an unreadable response."
            }));
        return Response.json(body, {
            status: res.status
        });
    } catch (err) {
        console.error("[api/hazards] hazards server unreachable:", err);
        return Response.json({
            detail: "The hazards server is not reachable."
        }, {
            status: 503
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1r77uxszv054x._.js.map