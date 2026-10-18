"use client";
import { useEffect, useRef, useState } from "react";
import { AudioLines, LoaderCircle, Mic, Square } from "lucide-react";
import type { Report } from "@/lib/types";
import { HazardVoice, type TranscriptLine, type VoiceState } from "@/lib/voice";

const labels: Record<VoiceState, string> = {
  idle: "Ask with your voice",
  connecting: "Connecting…",
  listening: "Listening… ask away",
  thinking: "Thinking…",
  speaking: "Grok is speaking…",
};

export function VoiceControls({ report }: { report: Report | null }) {
  const [state, setState] = useState<VoiceState>("idle");
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState("");
  const voice = useRef<HazardVoice | null>(null);
  const current = useRef(report);
  useEffect(() => { current.current = report; }, [report]);
  useEffect(() => () => { voice.current?.stop(); }, []);

  function toggle() {
    if (state !== "idle") { voice.current?.stop(); return; }
    if (!report) return;
    setError("");
    setLines([]);
    voice.current = new HazardVoice(() => current.current, { state: setState, transcript: setLines, error: setError });
    void voice.current.start();
  }

  const active = state !== "idle";
  return (
    <section
      className={`mt-5 flex flex-wrap items-center gap-3.5 rounded-[14px] border bg-secondary p-[22px] text-card-foreground ${active ? "border-primary" : "border-border"}`}
      aria-label="Ask Grok about this home"
    >
      <div className="flex items-center gap-[11px]">
        <div className="text-primary"><AudioLines size={23} /></div>
        <div>
          <h3 className="font-serif text-[19px] font-normal">A little clarity. Just ask.</h3>
          <p className="mt-1.5 text-[11px] text-[#b9cbc6]">Talk through this home’s observations with Grok Voice.</p>
        </div>
      </div>
      <button
        className="ml-auto flex items-center gap-[7px] rounded-full border border-border bg-card px-4 py-[11px] text-[11px] text-primary disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        onClick={toggle}
        disabled={!report}
        aria-pressed={active}
      >
        {state === "connecting" ? <LoaderCircle size={16} className="animate-spin" /> : active ? <Square size={14} /> : <Mic size={16} />}
        {active && state !== "connecting" ? `${labels[state]} (tap to stop)` : labels[state]}
      </button>
      <p className="m-0 basis-full text-[10px] leading-[1.6] text-[#b9cbc6]">
        {report
          ? "Try “Did this place flood?” or “Is it hotter here than nearby?” Microphone audio goes to xAI only while voice is on."
          : "Voice becomes available after you look up an address."}
      </p>
      {error && <p className="m-0 basis-full text-[12px] leading-[1.7] text-destructive" role="alert">{error}</p>}
      {lines.length > 0 && (
        <ol className="m-0 grid basis-full list-none gap-2 border-t border-border p-0 pt-3 text-[12px] leading-[1.7]" aria-live="polite" aria-label="Voice transcript">
          {lines.map((line) => (
            <li key={line.id} className={line.role === "user" ? "text-[#b9cbc6]" : "text-card-foreground"}>
              <span className="font-semibold">{line.role === "user" ? "You: " : "Grok: "}</span>
              {line.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
