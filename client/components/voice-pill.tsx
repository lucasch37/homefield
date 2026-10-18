"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Mic01Icon } from "@hugeicons/core-free-icons";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import "./voice-pill.css";

const LOOP = 4.8;
const SYLLABLES = [
  [0.1, 0.16, 0.9], [0.3, 0.12, 0.7], [0.5, 0.2, 1],
  [0.95, 0.14, 0.8], [1.15, 0.1, 0.6], [1.3, 0.22, 0.95],
  [1.9, 0.16, 0.85], [2.12, 0.12, 0.7], [2.3, 0.18, 0.9],
  [2.55, 0.1, 0.5], [3.05, 0.24, 1], [3.4, 0.12, 0.75],
  [3.6, 0.16, 0.9],
] as const;

const WAVE_EVERY = 4;
const WAVE_MAX = 80;
const SLIDE_MIN = 4;

type StopReason = "tap" | "release" | "key" | "escape" | "blur" | "cancel";

type VoicePillProps = {
  active: boolean;
  disabled?: boolean;
  accentColor?: string;
  iconColor?: string;
  background?: string;
  size?: number;
  reach?: number;
  cancelDistance?: number;
  ariaLabel?: string;
  onStart: () => void;
  onStop: (reason: StopReason) => void;
};

type PillStyle = CSSProperties & Record<`--vp-${string}`, string | number>;

function simulatedLevel(time: number) {
  const position = time % LOOP;
  let amount = 0.06;
  for (const [start, duration, peak] of SYLLABLES) {
    const progress = (position - start) / duration;
    if (progress >= 0 && progress <= 1) {
      amount = Math.max(amount, peak * 0.5 * (1 - Math.cos(2 * Math.PI * progress)));
    }
  }
  return amount * (0.7 + 0.3 * Math.abs(Math.sin(2 * Math.PI * 7.1 * position)));
}

function clock(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function VoicePill({
  active,
  disabled = false,
  accentColor = "#f5f5f5",
  iconColor = "#a1a1aa",
  background = "#27272a",
  size = 40,
  reach = 8,
  cancelDistance = 64,
  ariaLabel = "Ask with your voice",
  onStart,
  onStop,
}: VoicePillProps) {
  const [pressed, setPressed] = useState(false);
  const [input, setInput] = useState<"pointer" | "key">("pointer");
  const rootRef = useRef<HTMLButtonElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const runtime = useRef({
    pointerId: null as number | null,
    ownPress: false,
    downX: 0,
    downAt: 0,
    sliding: false,
    startedAt: 0,
    hist: [] as number[],
    tick: 0,
    acc: 0,
    env: 0,
    last: 0,
    raf: 0,
  });

  useEffect(() => {
    const state = runtime.current;
    if (!active) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
      state.hist = [];
      return;
    }
    state.startedAt = performance.now();
    state.last = state.startedAt;
    state.hist = [];
    state.tick = 0;
    state.acc = 0;
    state.env = 0;

    const frame = (now: number) => {
      const delta = Math.min((now - state.last) / 1000, 0.05);
      state.last = now;
      const target = simulatedLevel((now - state.startedAt) / 1000);
      const timeConstant = Math.max(1, target > state.env ? 40 : 240) / 1000;
      state.env += (target - state.env) * (1 - Math.exp(-delta / timeConstant));
      if (timeRef.current) timeRef.current.textContent = clock(now - state.startedAt);

      const canvas = waveRef.current;
      if (canvas) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        const context = canvas.getContext("2d");
        state.acc = Math.max(state.acc, state.env);
        state.tick = (state.tick + 1) % WAVE_EVERY;
        if (state.tick === 0) {
          state.hist.push(state.acc);
          state.acc = 0;
          if (state.hist.length > WAVE_MAX) state.hist.shift();
        }
        if (context) {
          const barWidth = 2 * dpr;
          const step = 3 * dpr;
          const shift = (state.tick / WAVE_EVERY) * step;
          context.clearRect(0, 0, width, height);
          context.fillStyle = accentColor;
          for (let index = 0; index < state.hist.length; index += 1) {
            const value = state.hist[state.hist.length - 1 - index];
            const x = width - (index + 1) * step - shift;
            if (x + barWidth < 0) break;
            const barHeight = Math.max(barWidth, (0.1 + 0.9 * value) * height);
            const fadeAt = Math.min(1, Math.max(0, (x + barWidth / 2) / (width * 0.55)));
            context.globalAlpha = (0.35 + 0.65 * value) * fadeAt * fadeAt * (3 - 2 * fadeAt);
            context.beginPath();
            context.roundRect(x, (height - barHeight) / 2, barWidth, barHeight, barWidth / 2);
            context.fill();
          }
          context.globalAlpha = 1;
        }
      }
      state.raf = requestAnimationFrame(frame);
    };
    state.raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    };
  }, [accentColor, active]);

  useEffect(() => {
    if (!pressed) return;
    const stop = () => active && onStop("blur");
    const visibility = () => document.hidden && stop();
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [active, onStop, pressed]);

  function settleSlide() {
    const state = runtime.current;
    state.sliding = false;
    if (!rootRef.current) return;
    delete rootRef.current.dataset.sliding;
    rootRef.current.style.setProperty("--vp-slide", "0px");
    rootRef.current.style.setProperty("--vp-cancel", "0");
  }

  function pointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const state = runtime.current;
    if (disabled || event.button !== 0 || !event.isPrimary || state.pointerId !== null) return;
    state.pointerId = event.pointerId;
    state.downX = event.clientX;
    state.downAt = performance.now();
    state.ownPress = !active;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPressed(true);
    if (!active) onStart();
  }

  function pointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const state = runtime.current;
    if (state.pointerId !== event.pointerId || !active || !state.ownPress || !rootRef.current) return;
    const distance = event.clientX - state.downX;
    if (!state.sliding && distance > -SLIDE_MIN) return;
    state.sliding = true;
    rootRef.current.dataset.sliding = "";
    const pull = Math.min(cancelDistance + 24, Math.max(0, -distance));
    rootRef.current.style.setProperty("--vp-slide", `${-pull}px`);
    rootRef.current.style.setProperty("--vp-cancel", String(Math.min(1, pull / cancelDistance)));
    if (pull >= cancelDistance) {
      settleSlide();
      onStop("cancel");
    }
  }

  function pointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const state = runtime.current;
    if (state.pointerId !== event.pointerId) return;
    state.pointerId = null;
    setPressed(false);
    if (state.sliding) settleSlide();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (active && !state.ownPress) onStop("tap");
  }

  const clockWidth = 32;
  const waveWidth = Math.round(size * 1.9);
  const extra = clockWidth + waveWidth;
  const style: PillStyle = {
    "--vp-accent": accentColor,
    "--vp-icon": iconColor,
    "--vp-bg": background,
    "--vp-size": `${size}px`,
    "--vp-radius": `${size / 2}px`,
    "--vp-reach": `${reach}px`,
    "--vp-extra": `${extra}px`,
    "--vp-clock-w": `${clockWidth}px`,
    "--vp-wave-w": `${waveWidth}px`,
    "--vp-stop": `${Math.round(size * 0.32)}px`,
    "--vp-open": "200ms",
    "--vp-hit": `${Math.max(0, Math.min(10, (44 - size) / 2))}px`,
  };

  return (
    <button
      ref={rootRef}
      type="button"
      disabled={disabled}
      aria-label={active ? "Stop voice conversation" : ariaLabel}
      aria-pressed={active}
      className="voice-pill"
      data-state={active ? "listening" : "idle"}
      data-pressed={pressed ? "" : undefined}
      data-input={input}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onLostPointerCapture={pointerUp}
      onKeyDown={(event) => {
        if (event.key === "Escape" && active) {
          event.preventDefault();
          onStop("escape");
        } else if ((event.key === " " || event.key === "Enter") && !event.repeat) {
          event.preventDefault();
          setInput("key");
          if (active) onStop("key");
          else onStart();
        }
      }}
      style={style}
    >
      <span className="voice-pill__capsule" aria-hidden="true" />
      <canvas ref={waveRef} className="voice-pill__wave" aria-hidden="true" />
      <span className="voice-pill__cancel" aria-hidden="true">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={12} strokeWidth={2.2} />
        <span>Cancel</span>
      </span>
      <span ref={timeRef} className="voice-pill__time" aria-hidden="true">0:00</span>
      <span className="voice-pill__glyph" aria-hidden="true">
        <span className="voice-pill__mic">
          <HugeiconsIcon icon={Mic01Icon} size={Math.round(size * 0.54)} strokeWidth={2} />
        </span>
        <span className="voice-pill__stop" />
      </span>
    </button>
  );
}
