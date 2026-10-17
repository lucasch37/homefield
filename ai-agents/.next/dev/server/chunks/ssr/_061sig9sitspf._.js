(()=>{"use strict";module.exports = [
"[project]/components/VoiceButton.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VoiceButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// Mic toggle for Grok Voice with a live transcript. Grok can look up any King County address by voice.
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
    const getCurrent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>hazards, [
        hazards
    ]);
    const { status, transcript, error, start, stop, active } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$useGrokVoice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGrokVoice"])(getCurrent);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "flex flex-col gap-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: active ? stop : start,
                disabled: status === "connecting",
                "aria-pressed": active,
                className: `rounded-full px-5 py-3 font-medium text-white transition disabled:opacity-50 ${active ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`,
                children: active ? `■ ${LABEL[status]}` : `🎙 ${LABEL[status]}`
            }, void 0, false, {
                fileName: "[project]/components/VoiceButton.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-red-600",
                children: error
            }, void 0, false, {
                fileName: "[project]/components/VoiceButton.tsx",
                lineNumber: 36,
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
                                lineNumber: 41,
                                columnNumber: 15
                            }, this),
                            line.text
                        ]
                    }, i, true, {
                        fileName: "[project]/components/VoiceButton.tsx",
                        lineNumber: 40,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/VoiceButton.tsx",
                lineNumber: 38,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/VoiceButton.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
}),
"[project]/lib/summary/facts.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACTION_KEYWORDS",
    ()=>ACTION_KEYWORDS,
    "DEFAULT_ACTIONS",
    ()=>DEFAULT_ACTIONS,
    "HAZARD_KEYWORDS",
    ()=>HAZARD_KEYWORDS,
    "buildFacts",
    ()=>buildFacts,
    "formatDate",
    ()=>formatDate,
    "numbersIn",
    ()=>numbersIn
]);
// Turns the /hazards JSON into plain-English fact lines for the summary model.
// The model only rewords these lines, so every number and date it may use is decided here.
const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];
const DEFAULT_ACTIONS = {
    flood: "Sign up for King County flood alerts",
    heat: "Find a cooling center and ways to keep your home cool",
    ground_motion: "Watch for new foundation or wall cracks and ask the landlord or an inspector"
};
const ACTION_KEYWORDS = {
    flood: [
        "alert"
    ],
    heat: [
        "cool"
    ],
    ground_motion: [
        "crack",
        "inspect"
    ]
};
const HAZARD_KEYWORDS = {
    flood: [
        "flood",
        "water",
        "wet"
    ],
    heat: [
        "heat",
        "hot",
        "temperature",
        "°f",
        "degrees"
    ],
    ground_motion: [
        "ground",
        "movement",
        "moved",
        "moving"
    ]
};
function formatDate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}
const plural = (n, word)=>`${n} ${word}${n === 1 ? "" : "es"}`;
// Each builder returns { score, text, short, unknown?, skip? }.
// text = one FACTS line for the model; short = ready-made sentences for the no-AI template.
function floodFact(f) {
    const passes = f.observed_passes;
    switch(f.status){
        case "flooded":
        case "frequently_wet":
            {
                const first = formatDate(f.first_wet), last = formatDate(f.last_wet);
                const when = first === last ? `on ${first}` : `first on ${first} and most recently on ${last}`;
                const saw = `Satellite radar saw water at this spot on ${f.wet_passes} of ${plural(passes, "pass")}, ${when}.`;
                return {
                    score: 100,
                    text: `Flood: ${saw.replace(/^S/, "s")}`,
                    short: [
                        saw
                    ]
                };
            }
        case "permanent_water":
            return {
                score: 50,
                text: `Flood: satellite radar saw water at this exact point on ${f.wet_passes} of ${plural(passes, "pass")}, so the point is on a river, lake, or pond. The map pin may be on the water instead of the home.`,
                short: [
                    "Satellite radar saw water at this exact point on almost every pass, so the map pin may be on a river, lake, or pond instead of the home."
                ]
            };
        case "no_flooding_seen":
            return {
                score: 10,
                text: `Flood: no flooding was observed at this spot in ${plural(passes, "satellite radar pass")}. Passes are days apart, so a short flood could be missed.`,
                short: [
                    `No flooding was observed at this spot in ${plural(passes, "satellite radar pass")}, but passes are days apart, so a short flood could be missed.`
                ]
            };
        case "not_enough_data":
            return {
                score: 0,
                unknown: true,
                text: `Flood: UNKNOWN. Satellites could not get enough reliable readings at this spot to tell whether it has flooded.`,
                short: [
                    "Satellites could not get enough reliable readings here to tell whether this spot has flooded."
                ]
            };
        default:
            return {
                score: 0,
                unknown: true,
                text: `Flood: UNKNOWN. The flood data could not be checked for this spot.`,
                short: [
                    "The flood data could not be checked for this spot."
                ]
            };
    }
}
// Heat compares this spot with the typical spot in lowland King County on the same clear days
// (recent_relative_f, lowland_percentile). county_percentile / diff_from_median_f are null in the real data.
function heatFact(h) {
    if (h.status === "ok" && h.surface_temp_f != null && h.recent_relative_f != null) {
        const temp = Math.round(h.surface_temp_f);
        const rel = Math.round(h.recent_relative_f);
        const pct = h.lowland_percentile == null ? null : Math.round(h.lowland_percentile);
        const years = h.recent_years?.length ? ` in ${h.recent_years[0]} to ${h.recent_years[h.recent_years.length - 1]}` : "";
        const compare = rel > 0 ? `about ${rel}°F hotter than` : rel < 0 ? `about ${-rel}°F cooler than` : "about the same as";
        const rank = pct == null ? "" : pct >= 99 ? " That puts it among the hottest 1% of spots in lowland King County." : pct <= 1 ? " That puts it among the coolest 1% of spots in lowland King County." : pct >= 50 ? ` That is hotter than about ${pct}% of spots in lowland King County.` : ` That is cooler than about ${100 - pct}% of spots in lowland King County.`;
        const score = pct == null ? 30 : pct >= 90 ? 80 : pct >= 75 ? 70 : 30;
        const measured = `On clear summer days around noon${years}, the ground and roofs here measured about ${temp}°F.`;
        const vs = `That is ${compare} a typical spot in lowland King County on the same days.`;
        return {
            score,
            text: `Heat: ${measured.replace(/^O/, "o")} ${vs}${rank} It measures the ground and roofs, not the air.`,
            short: [
                measured,
                `${vs.replace(/\.$/, "")}${rank ? "," + rank.replace(/^ That (puts it|is)/, (m, v)=>v === "is" ? " which is" : " putting it").replace(/\.$/, "") : ""}.`
            ]
        };
    }
    if (h.status === "not_available") return {
        score: -1,
        skip: true,
        text: `Heat: not included in this report.`,
        short: []
    };
    return {
        score: 0,
        unknown: true,
        text: `Heat: UNKNOWN. The satellite heat data could not tell us about this spot.`,
        short: [
            "The satellite heat data could not tell us about this spot."
        ]
    };
}
// Velocity is line-of-sight and the sign is not verified yet, so only the size is reported, never a direction.
function groundFact(g) {
    if (g.status === "ok" && g.velocity_mm_per_yr != null) {
        const raw = Math.abs(g.velocity_mm_per_yr);
        const v = Math.round(raw);
        const amount = raw < 1 ? "less than 1 mm per year" : `about ${v} mm per year`;
        const score = v >= 10 ? 60 : 20;
        const measured = `Satellites measured slow ground movement of ${amount} at this spot, measured along the satellite's slanted view.`;
        return {
            score,
            text: `Ground motion: ${measured.replace(/^S/, "s")} This is slow movement, not earthquake shaking.`,
            short: [
                measured
            ]
        };
    }
    if (g.status === "not_available") return {
        score: -1,
        skip: true,
        text: `Ground motion: not included in this report.`,
        short: []
    };
    return {
        score: 0,
        unknown: true,
        text: `Ground motion: UNKNOWN. Satellites could not get enough reliable readings here to measure slow ground movement.`,
        short: [
            "Satellites could not get enough reliable readings here to measure slow ground movement."
        ]
    };
}
const BUILDERS = {
    flood: floodFact,
    heat: heatFact,
    ground_motion: groundFact
};
const DEV_CAVEAT = /longitude|\bframe\b|displacement variable|pipeline|sign convention|delivered files|composite median|reliable segments|use years:|percentiles compare/i;
function buildFacts(report) {
    if (!report.in_king_county) {
        return {
            outside: true,
            lines: [],
            hazards: [],
            lead: null,
            action: null,
            actionHazard: null,
            unknown: [],
            allowedNumbers: new Set()
        };
    }
    const hazards = [];
    for (const [key, build] of Object.entries(BUILDERS)){
        const h = report.hazards?.[key];
        if (!h) continue;
        const fact = build(h);
        hazards.push({
            key,
            status: h.status,
            action: (h.action || DEFAULT_ACTIONS[key]).replace(/\.$/, ""),
            ...fact
        });
    }
    const ranked = hazards.filter((h)=>!h.skip).sort((a, b)=>b.score - a.score);
    // Only lead with something notable (flood seen, very hot, fast movement). Otherwise lead with flood.
    const lead = ranked[0]?.score >= 50 ? ranked[0] : hazards.find((h)=>h.key === "flood") || ranked[0];
    const lines = hazards.filter((h)=>!h.skip).map((h)=>h.text);
    // The limitations the backend sends for each hazard we have a real reading for. They give the model true
    // material to explain a short report with, so it doesn't pad with hazards that aren't in the data.
    // Only the reader-facing limitations. The server's list also carries developer notes (frame IDs,
    // "west of longitude -121.9", "100 m native", sign-convention instructions) that the model repeated
    // verbatim and whose numbers then slipped past the number check.
    const caveats = [
        ...new Set(hazards.filter((h)=>!h.skip && !h.unknown).flatMap((h)=>report.hazards?.[h.key]?.source?.limitations || []).filter((c)=>!DEV_CAVEAT.test(c)).map((c)=>c.replace(/; (thermal detail is|reference dates change) .*$/, ".")))
    ];
    return {
        outside: false,
        address: report.address || "this location",
        lines,
        caveats,
        skipped: hazards.filter((h)=>h.skip).map((h)=>h.key),
        hazards,
        lead: lead?.key ?? null,
        actionHazard: lead?.key ?? null,
        action: lead?.action ?? null,
        unknown: hazards.filter((h)=>h.unknown).map((h)=>h.key),
        allowedNumbers: numbersIn([
            report.address || "",
            ...lines,
            ...caveats,
            lead?.action || ""
        ].join(" "))
    };
}
function numbersIn(text) {
    return new Set((text.match(/\d[\d,]*(?:\.\d+)?/g) || []).map((n)=>n.replace(/,/g, "")));
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
const VOICE_INSTRUCTIONS = `You answer spoken questions about natural hazards (flooding, heat, and slow ground movement) at homes anywhere in King County, Washington.
Call get_hazards before answering any question about a place. Pass the street address the user said, with the city, for example "400 Broad St, Seattle". If they ask about "this place" or "here" without naming one, call it with no address to use the address on screen. Reuse the last address for follow-up questions about the same place.
If get_hazards returns an error, say it briefly and do what it says (usually ask for a full street address with the city). Never guess hazards for a place you could not look up.
get_hazards returns, for flood, heat, and ground_motion, a status, a "finding" sentence written from NASA satellite data, and an action. Answer from those findings in your own words. Use only the numbers, dates, and comparisons they contain, and do not do any math with them.
If the data cannot answer the question, say so and suggest who could (King County flood warning center, a structural engineer, the landlord).
Keep answers under 4 sentences. Never use the word "safe" at all, not even in phrases like "to be safe" or "stay safe". Do not give legal, insurance, or medical advice.
A status of not_enough_data or error means the satellites could not tell us, not that the home is fine. Only say they could not get a reliable reading; do not describe what those few passes showed.
"no_flooding_seen" means no flooding was observed on the satellite passes, not that the home cannot flood.
Heat is ground and roof surface temperature around noon on clear summer days, compared with a typical spot in lowland King County. Say "lowland King County", never coordinates or longitude, and do not mention percentiles unless the finding does.
For "is it getting hotter", use only the heat "trend" if there is one, and say what it compares. If there is no trend, say the report does not show that.
Ground motion: say "moving about X millimeters per year along the satellite's slanted view". Never say up, down, rising, sinking, toward, or away, or that it is not sinking: the direction is not confirmed yet.
Do not guess how long a flood lasted, what the satellites might have missed, or why something happened, and do not add general facts about houses, basements, or rivers.
When a status is not_available, that layer is not part of this report yet: say so, and do not say the satellites tried and failed.
If an address is outside King County, say this report only covers King County and suggest that place's own city or county.
If asked about a hazard this app does not measure (wildfire, landslides, earthquakes, air quality), say this report does not cover it, then share only what get_hazards returned.
Speak plainly and warmly, like a helpful neighbor.`;
const GET_HAZARDS_TOOL = {
    type: "function",
    name: "get_hazards",
    description: "Looks up flood, heat, and ground motion results from NASA satellite data for any address in King County, Washington. Call this before answering any question about a place.",
    parameters: {
        type: "object",
        properties: {
            address: {
                type: "string",
                description: 'Street address with city, e.g. "400 Broad St, Seattle, WA". Leave out to use the address currently shown on the page.'
            }
        },
        required: []
    }
};
}),
"[project]/lib/voice/data.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hazardsForVoice",
    ()=>hazardsForVoice,
    "runGetHazards",
    ()=>runGetHazards
]);
// What Grok Voice gets back from get_hazards: the same plain-English facts the written summary uses
// (lib/summary/facts.mjs), not the raw /hazards JSON. Tested on real data, the raw JSON led Grok to read
// "west of longitude -121.9" aloud and to call change_since_early_f a temperature drop. Safe for the browser.
// Relative import (not "@/") so node test scripts can load this file too.
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$summary$2f$facts$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/summary/facts.mjs [app-ssr] (ecmascript)");
;
const span = (years)=>years?.length ? `${years[0]} to ${years[years.length - 1]}` : "";
// change_since_early_f compares this spot with a typical lowland spot, then vs now. It says nothing about
// whether summers overall got hotter, so the wording keeps that explicit.
function heatTrend(h) {
    const c = h?.change_since_early_f;
    if (h?.status !== "ok" || c == null || !h.early_years?.length || !h.recent_years?.length) return undefined;
    const r = Math.round(Math.abs(c));
    const change = r === 0 ? "about the same" : `about ${r}°F ${c > 0 ? "warmer" : "cooler"}`;
    return `Compared with a typical spot in lowland King County, this spot ran ${change} in ${span(h.recent_years)} than it did in ${span(h.early_years)}. ` + `This compares spots with each other; it does not say whether summers overall got hotter or cooler.`;
}
function hazardsForVoice(report) {
    const r = report;
    if (!r) return {
        error: "No address has been looked up yet."
    };
    if (!r.in_king_county) return {
        address: r.address,
        in_king_county: false,
        message: "This address is outside King County, Washington, so this report has no hazard data for it. Do not suggest King County services for it; suggest its own city or county instead."
    };
    const facts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$summary$2f$facts$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildFacts"])(r);
    const hazards = {};
    for (const h of facts.hazards){
        hazards[h.key] = {
            status: h.status,
            finding: h.text.replace(/^[A-Za-z ]+: (UNKNOWN\. )?/, "").replace(/^./, (c)=>c.toUpperCase()),
            action: h.action,
            ...h.key === "heat" && heatTrend(r.hazards?.heat) ? {
                trend: heatTrend(r.hazards?.heat)
            } : {}
        };
    }
    return {
        address: r.address,
        in_king_county: true,
        hazards,
        limitations: facts.caveats ?? []
    };
}
async function runGetHazards(argsJson, { fetchHazards, current }) {
    let address = "";
    try {
        address = String(JSON.parse(argsJson || "{}").address ?? "").trim();
    } catch  {}
    if (!address) {
        return current ? hazardsForVoice(current) : {
            error: "No address yet. Ask the user for a street address in King County, with the city."
        };
    }
    try {
        const res = await fetchHazards(address);
        if (res.ok) return hazardsForVoice(await res.json());
        if (res.status === 404 || res.status === 422) return {
            error: `Could not find "${address}". Ask the user for a full street address with the city, like "400 Broad St, Seattle".`
        };
        return {
            error: "The hazard lookup is not working right now. Tell the user to try again in a moment."
        };
    } catch  {
        return {
            error: "The hazard lookup is not working right now. Tell the user to try again in a moment."
        };
    }
}
}),
"[project]/lib/voice/useGrokVoice.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useGrokVoice",
    ()=>useGrokVoice
]);
// Browser side of Grok Voice: mic -> PCM16 -> xAI realtime WebSocket -> spoken answer.
// Grok calls get_hazards(address?) and we look the address up anywhere in King County through /api/hazards,
// or use the report currently on the page when no address is given.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.4.2_@babel+core@7.29.7_@types+node@20.19.43_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/voice/config.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/voice/data.ts [app-ssr] (ecmascript)");
"use client";
;
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
function useGrokVoice(getCurrent) {
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
    // A tool call needs both its lookup result sent and the response that asked for it finished before we
    // ask Grok to speak; the lookup is a network call, so either can happen first.
    const toolCallRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])({
        active: false,
        inFlight: 0,
        responseDone: false
    });
    const getCurrentRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(getCurrent);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$4$2e$2_$40$babel$2b$core$40$7$2e$29$2e$7_$40$types$2b$node$40$20$2e$19$2e$43_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        getCurrentRef.current = getCurrent;
    }, [
        getCurrent
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
        toolCallRef.current = {
            active: false,
            inFlight: 0,
            responseDone: false
        };
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
    // Ask for the spoken answer once every lookup is answered and the response that called the tool is done.
    const continueAfterTool = ()=>{
        const tc = toolCallRef.current;
        if (!tc.active || !tc.responseDone || tc.inFlight > 0) return;
        toolCallRef.current = {
            active: false,
            inFlight: 0,
            responseDone: false
        };
        send({
            type: "response.create"
        });
    };
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
                    const tc = toolCallRef.current;
                    tc.active = true;
                    tc.inFlight++;
                    setStatus("thinking");
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2f$data$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["runGetHazards"])(typeof ev.arguments === "string" ? ev.arguments : "{}", {
                        fetchHazards: (address)=>fetch(`/api/hazards?address=${encodeURIComponent(address)}`),
                        current: getCurrentRef.current?.()
                    }).then((output)=>{
                        send({
                            type: "conversation.item.create",
                            item: {
                                type: "function_call_output",
                                call_id: ev.call_id,
                                output: JSON.stringify(output)
                            }
                        });
                        tc.inFlight--;
                        continueAfterTool();
                    });
                    break;
                }
            case "response.done":
                if (toolCallRef.current.active) {
                    toolCallRef.current.responseDone = true;
                    continueAfterTool();
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

//# sourceMappingURL=_061sig9sitspf._.js.map