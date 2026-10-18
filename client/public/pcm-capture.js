/* Capture mono microphone audio, resample it to the target rate (24 kHz for Grok Voice),
   and post little-endian PCM16 chunks of about 50 ms to the voice client. */
class PCMCapture extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const target = options?.processorOptions?.targetRate || sampleRate;
    this.step = sampleRate / target;      // input samples per output sample
    this.position = 0;                    // next output position, relative to the current block
    this.previous = 0;                    // last sample of the previous block
    this.chunk = new Int16Array(Math.round(target * 0.05));
    this.offset = 0;
  }
  push(sample) {
    const value = Math.max(-1, Math.min(1, sample));
    this.chunk[this.offset++] = value < 0 ? value * 32768 : value * 32767;
    if (this.offset === this.chunk.length) {
      const out = this.chunk.slice().buffer;
      this.port.postMessage(out, [out]);
      this.offset = 0;
    }
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || !input.length) return true;
    let t = this.position;
    // Linear interpolation; index -1 refers to the previous block's last sample.
    while (t < input.length - 1) {
      const i = Math.floor(t);
      const a = i < 0 ? this.previous : input[i];
      this.push(a + (input[i + 1] - a) * (t - i));
      t += this.step;
    }
    this.position = t - input.length;
    this.previous = input[input.length - 1];
    return true;
  }
}
registerProcessor("pcm-capture", PCMCapture);
