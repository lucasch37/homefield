"use client";
import { useEffect, useRef, useState } from "react";
import { AudioLines } from "lucide-react";
import type { Report } from "@/lib/types";
import { HazardVoice, type TranscriptLine, type VoiceState } from "@/lib/voice";
import { placeLabel } from "@/lib/format";
import VoicePill from "./voice-pill";

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
  useEffect(() => {
    current.current = report;
  }, [report]);
  useEffect(
    () => () => {
      voice.current?.stop();
    },
    [],
  );
  const [status, setStatus] = useState<{
    connected: boolean;
    message?: string;
  } | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/ai-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (live) setStatus(data?.voice ?? null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  function start() {
    if (state !== "idle") return;
    if (!report) return;
    setError("");
    setLines([]);
    voice.current = new HazardVoice(
      () => current.current,
      {
        state: setState,
        transcript: setLines,
        error: setError,
      },
      placeLabel(report),
    );
    void voice.current.start();
  }

  function stop() {
    voice.current?.stop();
  }

  const active = state !== "idle";
  const initialLoading = state === "connecting";
  return (
    <section
      className="mt-5 flex flex-wrap items-center gap-3.5 rounded-[14px] border border-violet-300/50 bg-[#0b0614] p-[22px] text-card-foreground"
      aria-label="Ask Grok about this home"
    >
      <div className="flex items-center gap-[11px]">
        <div className="text-primary">
          <AudioLines size={23} />
        </div>
        <div>
          <h3 className="font-serif text-[19px] font-normal">
            A little clarity. Just ask.
          </h3>
          <p className="mt-1.5 text-[11px] text-[#b9afcc]">
            Talk through this home’s observations with Grok Voice.
          </p>
        </div>
      </div>
      <div className="ml-auto flex min-h-11 min-w-[165px] items-center justify-end gap-3 max-[560px]:basis-full">
        {initialLoading ? (
          <span className="text-[11px] text-violet-300" aria-live="polite">
            Loading…
          </span>
        ) : (
          (!active || state === "thinking") && (
            <span className="text-[11px] text-[#b9afcc]">{labels[state]}</span>
          )
        )}
        <VoicePill
          active={active}
          disabled={!report}
          loading={initialLoading}
          accentColor="#ddd3fe"
          iconColor="#1e1033"
          background="#c4b5fd"
          size={40}
          reach={8}
          ariaLabel="Ask Grok about this home"
          onStart={start}
          onStop={stop}
        />
      </div>
      <p className="m-0 basis-full text-[10px] leading-[1.6] text-[#b9afcc]">
        {report
          ? "Try “Did this place flood?” or “Is it hotter here than nearby?” Microphone audio goes to xAI only while voice is on."
          : "Voice becomes available after you look up an address."}
      </p>
      {status && !status.connected && !error && status.message && (
        <p
          className="m-0 basis-full rounded-md bg-violet-300/10 px-3 py-2 text-[12px] leading-[1.6] text-violet-300"
          data-testid="grok-status"
        >
          {status.message}
        </p>
      )}
      {error && (
        <p
          className="m-0 basis-full text-[12px] leading-[1.7] text-[#ffb3d6]"
          role="alert"
        >
          {error}
        </p>
      )}
      {lines.length > 0 && (
        <ol
          className="m-0 grid basis-full list-none gap-2 border-t border-violet-300/25 p-0 pt-3 text-[12px] leading-[1.7]"
          aria-live="polite"
          aria-label="Voice transcript"
        >
          {lines.map((line) => (
            <li
              key={line.id}
              className={
                line.role === "user" ? "text-[#b9afcc]" : "text-card-foreground"
              }
            >
              <span className="font-semibold">
                {line.role === "user" ? "You: " : "Grok: "}
              </span>
              {line.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
