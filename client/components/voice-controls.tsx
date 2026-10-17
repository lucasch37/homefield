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
  return <section className={`mt-5 flex flex-wrap items-center gap-3.5 rounded-[7px] border bg-secondary p-[19px] text-card-foreground ${state !== "idle" ? "border-primary" : "border-border"}`}><div className="flex items-center gap-[11px]"><div className="text-primary"><AudioLines size={23} /></div><div><h3 className="font-serif text-[17px] font-normal">A little clarity. Just ask.</h3><p className="mt-1.5 text-[9px] text-[#b9cbc6]">Talk through this home’s observations with Grok.</p></div></div><button className="flex items-center gap-[7px] rounded border border-border bg-card px-3 py-[11px] text-[10px] text-primary disabled:cursor-not-allowed disabled:opacity-50 min-[1450px]:ml-auto max-[760px]:ml-auto" onClick={toggle} disabled={!report} aria-pressed={state !== "idle"}>{state === "connecting" ? <LoaderCircle size={16} className="animate-spin" /> : state !== "idle" ? <Square size={14} /> : <Mic size={16} />}{labels[state]}</button><p className="m-0 basis-full text-[9px] leading-[1.6] text-[#b9cbc6]">{report ? "Try “What do these flood observations mean?” Microphone audio is sent to xAI while connected." : "Your voice conversation becomes available after you look up an address."}</p>{error && <p className="m-0 basis-full text-[11px] leading-[1.7] text-destructive" role="alert">{error}</p>}{transcript && <p className="m-0 basis-full border-t border-border pt-2.5 text-[11px] leading-[1.7]" aria-live="polite">{transcript}</p>}</section>;
}
