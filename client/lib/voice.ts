// Browser side of Grok Voice: microphone -> PCM16 -> xAI realtime WebSocket -> spoken answer.
// Grok calls get_hazards; the browser answers with fact sentences built from the report on screen
// (or from /api/report when the user names another address).

import { fetchJSON } from "./api";
import type { ReportResult } from "./types";
import {
  allowedRealtimeUrl,
  base64ToFloat32,
  GET_HAZARDS_TOOL,
  pcm16ToBase64,
  runGetHazards,
  sessionUpdate,
} from "./voice-session";

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";
export type TranscriptLine = { id: string; role: "user" | "assistant"; text: string };
type Callbacks = {
  state: (state: VoiceState) => void;
  transcript: (lines: TranscriptLine[]) => void;
  error: (message: string) => void;
};
type RealtimeEvent = { type?: unknown; [key: string]: unknown };

const DEFAULT_REALTIME_URL = "wss://api.x.ai/v1/realtime?model=grok-voice-latest";
// Audio is resampled to the 24 kHz PCM16 that xAI documents for Grok Voice, in both directions.
const VOICE_RATE = 24000;

export class HazardVoice {
  private socket?: WebSocket;
  private context?: AudioContext;
  private stream?: MediaStream;
  private input?: MediaStreamAudioSourceNode;
  private capture?: AudioWorkletNode;
  private silent?: GainNode;
  private stopped = false;
  private configured = false;
  private ready = false;
  private nextAudio = 0;
  private playing = new Set<AudioBufferSourceNode>();
  private lines: TranscriptLine[] = [];
  // A tool call needs its output sent, the response that asked for it finished, and current audio played
  // before we ask Grok to answer (the PRD's function flow).
  private tool = { active: false, inFlight: 0, responseDone: false };
  private connectTimer?: ReturnType<typeof setTimeout>;
  private configureTimer?: ReturnType<typeof setTimeout>;
  private abort = new AbortController();
  private lastError = "";
  private getReport: () => ReportResult | null;
  private callbacks: Callbacks;
  private location: string;

  constructor(getReport: () => ReportResult | null, callbacks: Callbacks, location = "") {
    this.getReport = getReport;
    this.callbacks = callbacks;
    this.location = location;
  }

  async start() {
    this.callbacks.state("connecting");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.WebSocket)
        throw new Error("Voice needs a browser with microphone support and a secure (https) connection.");
      const token = await fetchJSON<{ value: string; url?: string }>("/api/voice-token", { method: "POST", signal: this.abort.signal });
      if (this.stopped) return;
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (this.stopped) return this.releaseMedia();
      // Keep the device's own rate (forcing one breaks microphones in Firefox); the worklet resamples.
      this.context = new AudioContext();
      await this.context.resume();
      await this.context.audioWorklet.addModule("/pcm-capture.js");
      if (this.stopped) return;
      this.startCapture();
      this.connect(allowedRealtimeUrl(token.url) ?? DEFAULT_REALTIME_URL, token.value, false);
      this.connectTimer = setTimeout(() => this.fail(this.lastError
        ? `Grok Voice didn’t start: ${this.lastError}`
        : "Grok Voice took too long to connect. Please try again."), 15000);
    } catch (error) {
      if (this.stopped) return;
      this.fail(error instanceof Error && error.name === "NotAllowedError"
        ? "Microphone access was denied. Allow microphone access in your browser to use voice."
        : error instanceof Error && error.message ? error.message : "We couldn’t start voice.");
    }
  }

  // xAI's documented browser auth is the "xai-client-secret.<token>" subprotocol. If that handshake is
  // refused before opening, retry once with the OpenAI-compatible form, which also worked in team tests.
  private connect(url: string, token: string, compat: boolean) {
    const protocols = compat
      ? ["realtime", `openai-insecure-api-key.${token}`, "openai-beta.realtime-v1"]
      : [`xai-client-secret.${token}`];
    const socket = new WebSocket(url, protocols);
    this.socket = socket;
    let opened = false;
    socket.onopen = () => {
      opened = true;
      // xAI announces the session first; configure on that event, or shortly after opening if it is skipped.
      this.configureTimer = setTimeout(() => this.configure(), 1500);
    };
    socket.onmessage = (event) => {
      if (this.stopped) return;
      let message: RealtimeEvent;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      this.handle(message);
    };
    socket.onerror = () => {};
    socket.onclose = (event) => {
      if (this.stopped || this.socket !== socket) return;
      if (!opened && !compat) return this.connect(url, token, true);
      this.fail(this.ready
        ? "The voice session ended. Tap the microphone to reconnect."
        : `Grok Voice refused the connection${event.code && event.code !== 1006 ? ` (code ${event.code}${event.reason ? `: ${event.reason.slice(0, 120)}` : ""})` : ""}. Check that the xAI key has voice access, then try again.`);
    };
  }

  private send(event: Record<string, unknown>) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(event));
  }

  private configure() {
    if (this.configured || !this.context) return;
    this.configured = true;
    clearTimeout(this.configureTimer);
    this.send(sessionUpdate(VOICE_RATE, this.location));
  }

  private startCapture() {
    if (!this.context || !this.stream) return;
    this.input = this.context.createMediaStreamSource(this.stream);
    this.capture = new AudioWorkletNode(this.context, "pcm-capture", { processorOptions: { targetRate: VOICE_RATE } });
    this.silent = this.context.createGain();
    this.silent.gain.value = 0; // keeps the graph running without echoing the microphone
    this.capture.port.onmessage = ({ data }: MessageEvent<ArrayBuffer>) => {
      if (!this.ready || this.stopped) return;
      this.send({ type: "input_audio_buffer.append", audio: pcm16ToBase64(data) });
    };
    this.input.connect(this.capture);
    this.capture.connect(this.silent);
    this.silent.connect(this.context.destination);
  }

  private upsertLine(id: string, role: TranscriptLine["role"], text: string, append: boolean) {
    const index = this.lines.findIndex((line) => line.id === id);
    if (index === -1) this.lines = [...this.lines, { id, role, text }];
    else this.lines = this.lines.map((line, i) => i === index ? { ...line, text: append ? line.text + text : text } : line);
    this.callbacks.transcript(this.lines);
  }

  private handle(event: RealtimeEvent) {
    switch (event.type) {
      case "session.created":
      case "conversation.created":
        this.configure();
        break;
      case "session.updated":
        if (!this.ready) {
          this.ready = true;
          clearTimeout(this.connectTimer);
          this.callbacks.state("listening");
        }
        break;
      case "input_audio_buffer.speech_started":
        this.stopPlayback(); // let the user interrupt Grok
        this.callbacks.state("listening");
        break;
      case "input_audio_buffer.speech_stopped":
        this.callbacks.state("thinking");
        break;
      case "conversation.item.added":
      case "conversation.item.created": {
        const item = event.item as { id?: string; role?: string; content?: { type?: string; transcript?: string }[] } | undefined;
        const said = item?.role === "user" ? item.content?.find((part) => part.type === "input_audio" && part.transcript)?.transcript : undefined;
        if (said && item?.id) this.upsertLine(`user-${item.id}`, "user", said, false);
        break;
      }
      case "conversation.item.input_audio_transcription.completed":
        if (typeof event.transcript === "string" && event.transcript.trim())
          this.upsertLine(`user-${String(event.item_id ?? this.lines.length)}`, "user", event.transcript.trim(), false);
        break;
      case "response.output_audio.delta":
      case "response.audio.delta":
        if (typeof event.delta === "string") this.play(event.delta);
        break;
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta":
        if (typeof event.delta === "string")
          this.upsertLine(`grok-${String(event.response_id ?? event.item_id ?? "current")}`, "assistant", event.delta, true);
        break;
      case "response.function_call_arguments.done":
        this.runTool(event);
        break;
      case "response.done":
        if (this.tool.active) {
          this.tool.responseDone = true;
          this.continueAfterTool();
        } else if (!this.playing.size) this.callbacks.state("listening");
        break;
      case "error": {
        const detail = (event.error as { message?: unknown } | undefined)?.message;
        if (typeof detail === "string") this.lastError = detail.slice(0, 200);
        this.callbacks.error(typeof detail === "string" && detail
          ? `Grok Voice reported a problem: ${detail.slice(0, 200)}`
          : "Grok Voice couldn’t complete that request. Try asking again.");
        break;
      }
    }
  }

  private runTool(event: RealtimeEvent) {
    const callId = event.call_id;
    if (typeof callId !== "string") return;
    this.tool.active = true;
    this.tool.inFlight++;
    this.callbacks.state("thinking");
    const output = event.name === GET_HAZARDS_TOOL.name
      ? runGetHazards(event.arguments, this.getReport(), (address) =>
        fetch(`/api/report?address=${encodeURIComponent(address)}`, { cache: "no-store", signal: this.abort.signal }))
      : Promise.resolve({ error: "Unknown tool" });
    void output.then((result) => {
      if (this.stopped) return;
      this.send({ type: "conversation.item.create", item: { type: "function_call_output", call_id: callId, output: JSON.stringify(result) } });
      this.tool.inFlight--;
      this.continueAfterTool();
    });
  }

  private continueAfterTool() {
    const tool = this.tool;
    if (!tool.active || !tool.responseDone || tool.inFlight > 0 || this.playing.size) return;
    this.tool = { active: false, inFlight: 0, responseDone: false };
    this.send({ type: "response.create" });
    this.callbacks.state("thinking");
  }

  private play(base64: string) {
    if (!this.context) return;
    const samples = base64ToFloat32(base64);
    if (!samples.length) return;
    const buffer = this.context.createBuffer(1, samples.length, VOICE_RATE);
    buffer.getChannelData(0).set(samples);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    const start = Math.max(this.context.currentTime + 0.02, this.nextAudio);
    this.nextAudio = start + buffer.duration;
    this.playing.add(source);
    source.onended = () => {
      this.playing.delete(source);
      if (this.playing.size || this.stopped) return;
      this.continueAfterTool();
      if (!this.tool.active) this.callbacks.state("listening");
    };
    source.start(start);
    this.callbacks.state("speaking");
  }

  private stopPlayback() {
    for (const source of this.playing) {
      source.onended = null;
      try { source.stop(); } catch {}
      source.disconnect();
    }
    this.playing.clear();
    this.nextAudio = 0;
  }

  private releaseMedia() {
    this.stream?.getTracks().forEach((track) => track.stop());
  }

  private fail(message: string) {
    if (this.stopped) return;
    this.callbacks.error(message);
    this.stop();
  }

  stop() {
    this.stopped = true;
    this.ready = false;
    this.abort.abort();
    clearTimeout(this.connectTimer);
    clearTimeout(this.configureTimer);
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
    }
    if (this.capture) this.capture.port.onmessage = null;
    this.capture?.port.close();
    this.capture?.disconnect();
    this.input?.disconnect();
    this.silent?.disconnect();
    this.releaseMedia();
    this.stopPlayback();
    if (this.context && this.context.state !== "closed") void this.context.close();
    this.callbacks.state("idle");
  }
}
