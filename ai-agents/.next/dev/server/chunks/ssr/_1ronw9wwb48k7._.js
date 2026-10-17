(()=>{"use strict";module.exports = [
"[project]/app/voice-test/Picker.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Picker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// Lets the dev voice page switch between hand-written fixtures and cases built from the real flood rasters.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$VoiceButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/VoiceButton.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
function Picker({ cases }) {
    const [id, setId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(cases[0].id);
    const current = cases.find((c)=>c.id === id) ?? cases[0];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "flex flex-col gap-1 text-sm text-zinc-600",
                children: [
                    "Hazards data",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: id,
                        onChange: (e)=>setId(e.target.value),
                        className: "rounded border border-zinc-300 p-2 text-zinc-900",
                        children: cases.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: c.id,
                                children: c.label
                            }, c.id, false, {
                                fileName: "[project]/app/voice-test/Picker.tsx",
                                lineNumber: 19,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/voice-test/Picker.tsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/voice-test/Picker.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-zinc-600",
                children: [
                    "Address: ",
                    current.hazards.address,
                    ". Try “Did this place flood?”"
                ]
            }, void 0, true, {
                fileName: "[project]/app/voice-test/Picker.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$VoiceButton$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                hazards: current.hazards
            }, current.id, false, {
                fileName: "[project]/app/voice-test/Picker.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/voice-test/Picker.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/VoiceButton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VoiceButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// Mic toggle for Grok Voice follow-up questions, with a live transcript.
// Pass the same hazards JSON the cards render; Grok reads it through the get_hazards tool.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$useGrokVoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/voice/useGrokVoice.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const LABEL = {
    idle: "Ask a question out loud",
    connecting: "Connecting…",
    listening: "Listening… ask away",
    thinking: "Thinking…",
    speaking: "Speaking…",
    error: "Try again"
};
function VoiceButton({ hazards }) {
    const getHazards = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>hazards, [
        hazards
    ]);
    const { status, transcript, error, start, stop, active } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$useGrokVoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGrokVoice"])(getHazards);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "flex flex-col gap-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: active ? stop : start,
                disabled: !hazards || status === "connecting",
                "aria-pressed": active,
                className: `rounded-full px-5 py-3 font-medium text-white transition disabled:opacity-50 ${active ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`,
                children: active ? `■ ${LABEL[status]}` : `🎙 ${LABEL[status]}`
            }, void 0, false, {
                fileName: "[project]/components/VoiceButton.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-red-600",
                children: error
            }, void 0, false, {
                fileName: "[project]/components/VoiceButton.tsx",
                lineNumber: 35,
                columnNumber: 17
            }, this),
            transcript.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "flex flex-col gap-2 text-sm",
                "aria-live": "polite",
                children: transcript.map((line, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: line.role === "user" ? "text-zinc-500" : "text-zinc-900 dark:text-zinc-100",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-semibold",
                                children: line.role === "user" ? "You: " : "Grok: "
                            }, void 0, false, {
                                fileName: "[project]/components/VoiceButton.tsx",
                                lineNumber: 40,
                                columnNumber: 15
                            }, this),
                            line.text
                        ]
                    }, i, true, {
                        fileName: "[project]/components/VoiceButton.tsx",
                        lineNumber: 39,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/VoiceButton.tsx",
                lineNumber: 37,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/VoiceButton.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
}),
"[project]/lib/voice/config.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Grok Voice session settings. Safe to ship to the browser: no secrets here.
__turbopack_context__.s([
    "GET_HAZARDS_TOOL",
    ()=>GET_HAZARDS_TOOL,
    "VOICE",
    ()=>VOICE,
    "VOICE_INSTRUCTIONS",
    ()=>VOICE_INSTRUCTIONS,
    "XAI_REALTIME_URL",
    ()=>XAI_REALTIME_URL,
    "realtimeProtocols",
    ()=>realtimeProtocols
]);
const XAI_REALTIME_URL = "wss://api.x.ai/v1/realtime?model=grok-voice-latest";
const realtimeProtocols = (token)=>[
        `xai-client-secret.${token}`
    ];
const VOICE = "eve";
const VOICE_INSTRUCTIONS = `You answer spoken questions about natural hazards at one home address.
Always call get_hazards before answering a question about this home.
Use only that data. If the data cannot answer the question, say so and suggest who could (King County flood warning center, a structural engineer, the landlord).
Keep answers under 4 sentences. Never claim a home is safe. Do not give legal, insurance, or medical advice.
A status of not_enough_data or error means the satellites could not tell us, not that the home is fine.
"no_flooding_seen" means no flooding was observed on the satellite passes, not that the home cannot flood.
Heat numbers are ground and roof surface temperatures around noon on clear summer days.
Ground motion: say "moving about X millimeters per year along the satellite's slanted view". Never say the ground is rising, sinking, going up or going down, or that it is not sinking: the direction is not confirmed yet.
Only say what the data says. Do not guess how long a flood lasted, what the satellites might have missed, or why something happened, and do not add general facts about houses, basements, or rivers.
When a status is not_enough_data, only say the satellites could not get a reliable reading. Do not describe what those few passes showed.
When a status is not_available, that layer is not part of this report yet: say so, and do not say the satellites tried and failed.
If asked about a hazard this app does not measure (wildfire, landslides, earthquakes, air quality), say this report does not cover it, then share only what get_hazards actually returned.
Speak plainly and warmly, like a helpful neighbor.`;
const GET_HAZARDS_TOOL = {
    type: "function",
    name: "get_hazards",
    description: "Returns the flood, heat, and ground motion results from NASA satellite data for the home address the user is looking at. Call this before answering any question about the home.",
    parameters: {
        type: "object",
        properties: {},
        required: []
    }
};
}),
"[project]/lib/voice/useGrokVoice.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useGrokVoice",
    ()=>useGrokVoice
]);
// Browser side of Grok Voice: mic -> PCM16 -> xAI realtime WebSocket -> spoken answer.
// Grok calls get_hazards and we answer with the same hazards JSON the cards show.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/voice/config.ts [app-ssr] (ecmascript)");
"use client";
;
;
const CHUNK_MS = 100;
// Copies mic samples off the audio thread. Inlined so there is no extra file to serve.
const WORKLET_SOURCE = `
class MicTap extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("mic-tap", MicTap);
`;
function floatToPcm16Base64(samples) {
    const bytes = new Uint8Array(samples.length * 2);
    const view = new DataView(bytes.buffer);
    for(let i = 0; i < samples.length; i++){
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let bin = "";
    for(let i = 0; i < bytes.length; i += 0x8000)bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
}
function pcm16Base64ToFloat(b64) {
    const bin = atob(b64);
    const out = new Float32Array(bin.length / 2);
    for(let i = 0; i < out.length; i++){
        let v = bin.charCodeAt(i * 2) | bin.charCodeAt(i * 2 + 1) << 8;
        if (v >= 0x8000) v -= 0x10000;
        out[i] = v / 0x8000;
    }
    return out;
}
function useGrokVoice(getHazards) {
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("idle");
    const [transcript, setTranscript] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const wsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const ctxRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const streamRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const nodesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    const playingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const playheadRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const readyRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const configuredRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const toolOutputPendingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const getHazardsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(getHazards);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        getHazardsRef.current = getHazards;
    }, [
        getHazards
    ]);
    const send = (event)=>{
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event));
    };
    const appendLine = (role, text, merge)=>setTranscript((prev)=>{
            const last = prev[prev.length - 1];
            if (merge && last?.role === role) return [
                ...prev.slice(0, -1),
                {
                    role,
                    text: last.text + text
                }
            ];
            return [
                ...prev,
                {
                    role,
                    text
                }
            ];
        });
    const stopPlayback = ()=>{
        for (const src of playingRef.current){
            try {
                src.stop();
            } catch  {}
        }
        playingRef.current.clear();
        playheadRef.current = 0;
    };
    const playChunk = (b64)=>{
        const ctx = ctxRef.current;
        if (!ctx) return;
        const samples = pcm16Base64ToFloat(b64);
        const buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
        buf.getChannelData(0).set(samples);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        const startAt = Math.max(playheadRef.current, ctx.currentTime + 0.02);
        src.start(startAt);
        playheadRef.current = startAt + buf.duration;
        playingRef.current.add(src);
        src.onended = ()=>{
            playingRef.current.delete(src);
            if (playingRef.current.size === 0 && readyRef.current) setStatus((s)=>s === "speaking" ? "listening" : s);
        };
    };
    const stop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        readyRef.current = false;
        configuredRef.current = false;
        stopPlayback();
        wsRef.current?.close();
        wsRef.current = null;
        nodesRef.current.forEach((n)=>n.disconnect());
        nodesRef.current = [];
        streamRef.current?.getTracks().forEach((t)=>t.stop());
        streamRef.current = null;
        ctxRef.current?.close().catch(()=>{});
        ctxRef.current = null;
        setStatus((s)=>s === "error" ? s : "idle");
    }, []);
    const handleEvent = (ev, sampleRate)=>{
        switch(ev.type){
            case "conversation.created":
            case "session.created":
                if (!configuredRef.current) {
                    configuredRef.current = true;
                    send({
                        type: "session.update",
                        session: {
                            voice: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VOICE"],
                            instructions: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VOICE_INSTRUCTIONS"],
                            turn_detection: {
                                type: "server_vad"
                            },
                            audio: {
                                input: {
                                    format: {
                                        type: "audio/pcm",
                                        rate: sampleRate
                                    }
                                },
                                output: {
                                    format: {
                                        type: "audio/pcm",
                                        rate: sampleRate
                                    }
                                }
                            },
                            tools: [
                                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GET_HAZARDS_TOOL"]
                            ]
                        }
                    });
                }
                break;
            case "session.updated":
                readyRef.current = true;
                setStatus("listening");
                break;
            case "input_audio_buffer.speech_started":
                stopPlayback(); // let the user interrupt Grok
                setStatus("listening");
                break;
            case "input_audio_buffer.speech_stopped":
                setStatus("thinking");
                break;
            case "conversation.item.added":
            case "conversation.item.created":
                {
                    const item = ev.item;
                    const said = item?.role === "user" ? item.content?.find((c)=>c.type === "input_audio" && c.transcript)?.transcript : undefined;
                    if (said) appendLine("user", said, false);
                    break;
                }
            case "conversation.item.input_audio_transcription.completed":
                if (typeof ev.transcript === "string" && ev.transcript) appendLine("user", ev.transcript, false);
                break;
            case "response.output_audio.delta":
                if (typeof ev.delta === "string") {
                    setStatus("speaking");
                    playChunk(ev.delta);
                }
                break;
            case "response.output_audio_transcript.delta":
                if (typeof ev.delta === "string") appendLine("assistant", ev.delta, true);
                break;
            case "response.function_call_arguments.done":
                {
                    if (ev.name !== __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GET_HAZARDS_TOOL"].name) break;
                    const hazards = getHazardsRef.current();
                    send({
                        type: "conversation.item.create",
                        item: {
                            type: "function_call_output",
                            call_id: ev.call_id,
                            output: JSON.stringify(hazards ?? {
                                error: "No address has been looked up yet."
                            })
                        }
                    });
                    toolOutputPendingRef.current = true;
                    setStatus("thinking");
                    break;
                }
            case "response.done":
                // Ask for the spoken answer only after the response that made the tool call has finished.
                if (toolOutputPendingRef.current) {
                    toolOutputPendingRef.current = false;
                    send({
                        type: "response.create"
                    });
                } else if (playingRef.current.size === 0) {
                    setStatus("listening");
                }
                break;
            case "error":
                {
                    const e = ev.error;
                    console.error("[grok-voice]", ev);
                    setError(e?.message || "Grok Voice error");
                    break;
                }
        }
    };
    const start = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (wsRef.current) return;
        setError(null);
        setStatus("connecting");
        try {
            const res = await fetch("/api/voice-token", {
                method: "POST"
            });
            if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || "Could not start voice");
            const { token } = await res.json();
            const ctx = new AudioContext();
            ctxRef.current = ctx;
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;
            const url = URL.createObjectURL(new Blob([
                WORKLET_SOURCE
            ], {
                type: "application/javascript"
            }));
            await ctx.audioWorklet.addModule(url);
            URL.revokeObjectURL(url);
            const source = ctx.createMediaStreamSource(stream);
            const tap = new AudioWorkletNode(ctx, "mic-tap");
            const mute = ctx.createGain();
            mute.gain.value = 0; // keep the graph running without echoing the mic
            source.connect(tap).connect(mute).connect(ctx.destination);
            nodesRef.current = [
                source,
                tap,
                mute
            ];
            const chunkSize = Math.round(ctx.sampleRate * CHUNK_MS / 1000);
            let pending = [];
            let pendingLen = 0;
            tap.port.onmessage = (e)=>{
                if (!readyRef.current) return;
                pending.push(e.data);
                pendingLen += e.data.length;
                if (pendingLen < chunkSize) return;
                const chunk = new Float32Array(pendingLen);
                let off = 0;
                for (const p of pending){
                    chunk.set(p, off);
                    off += p.length;
                }
                pending = [];
                pendingLen = 0;
                send({
                    type: "input_audio_buffer.append",
                    audio: floatToPcm16Base64(chunk)
                });
            };
            const ws = new WebSocket(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["XAI_REALTIME_URL"], (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["realtimeProtocols"])(token));
            wsRef.current = ws;
            ws.onmessage = (m)=>{
                try {
                    handleEvent(JSON.parse(m.data), ctx.sampleRate);
                } catch (err) {
                    console.error("[grok-voice] bad event", err);
                }
            };
            ws.onerror = ()=>setError("Lost the connection to Grok Voice");
            ws.onclose = ()=>{
                if (wsRef.current === ws) {
                    wsRef.current = null;
                    stop();
                }
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStatus("error");
            stop();
        }
    // handleEvent reads only refs and stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        stop
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>stop, [
        stop
    ]);
    return {
        status,
        transcript,
        error,
        start,
        stop,
        active: status !== "idle" && status !== "error"
    };
}
}),
"[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime;
}),
];})()

//# sourceMappingURL=_1ronw9wwb48k7._.js.map