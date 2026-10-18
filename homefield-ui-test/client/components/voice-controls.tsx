"use client";
import { useEffect, useRef, useState } from "react";
import { AudioLines, LoaderCircle, Mic, Square } from "lucide-react";
import type { Report } from "@/lib/types";
import { HazardVoice, type VoiceState } from "@/lib/voice";

export function VoiceControls({ report }: { report: Report | null }) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const voice = useRef<HazardVoice | null>(null);
  useEffect(() => () => { voice.current?.stop(); }, []);
  const labels: Record<VoiceState, string> = { idle: "Ask with your voice", connecting: "Connecting…", listening: "Listening…", thinking: "Thinking…", speaking: "Grok is speaking…" };
  function toggle() {
    if (state !== "idle") { voice.current?.stop(); return; }
    if (!report) return;
    setError(""); setTranscript("");
    voice.current = new HazardVoice(report, { state: setState, transcript: setTranscript, error: setError });
    void voice.current.start();
  }
  return <section className={`mt-5 flex flex-wrap items-center gap-4 rounded-[22px] border bg-[#0d0b24]/60 p-[22px] text-foreground backdrop-blur-md transition-[border-color,box-shadow] ${state !== "idle" ? "border-teal-300/50 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_0_44px_-14px_rgba(94,234,212,.5)]" : "border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"}`}><div className="flex items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full border border-violet-300/25 bg-violet-400/10 text-violet-300"><AudioLines size={20} /></div><div><h3 className="font-serif text-[19px] font-normal tracking-[-.3px]">A little clarity. Just ask.</h3><p className="mt-1 text-[11px] text-slate-400">Talk through this home’s observations with Grok.</p></div></div><button className="ml-auto flex items-center gap-[7px] rounded-full bg-gradient-to-r from-teal-300 to-violet-400 px-4 py-[11px] text-[11px] font-semibold text-[#04131a] shadow-[0_0_24px_rgba(94,234,212,.25)] transition-shadow hover:shadow-[0_0_32px_rgba(167,139,250,.45)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none" onClick={toggle} disabled={!report} aria-pressed={state !== "idle"}>{state === "connecting" ? <LoaderCircle size={16} className="animate-spin" /> : state !== "idle" ? <Square size={14} /> : <Mic size={16} />}{labels[state]}</button><p className="m-0 basis-full text-[10px] leading-[1.6] text-slate-400">{report ? "Try “What do these flood observations mean?” Microphone audio is sent to xAI while connected." : "Your voice conversation becomes available after you look up an address."}</p>{error && <p className="m-0 basis-full text-[11px] leading-[1.7] text-destructive" role="alert">{error}</p>}{transcript && <p className="m-0 basis-full border-t border-white/10 pt-2.5 text-[12px] leading-[1.7] text-slate-200" aria-live="polite">{transcript}</p>}</section>;
}
