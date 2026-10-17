/* Capture mono audio in batches and transfer little-endian PCM16 to the voice client. */
class PCMCapture extends AudioWorkletProcessor {
  constructor() { super(); this.samples = new Float32Array(2048); this.offset = 0; }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (const sample of input) {
      this.samples[this.offset++] = sample;
      if (this.offset === this.samples.length) {
        const buffer = new ArrayBuffer(this.samples.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < this.samples.length; i++) { const value = Math.max(-1, Math.min(1, this.samples[i])); view.setInt16(i * 2, value < 0 ? value * 32768 : value * 32767, true); }
        this.port.postMessage(buffer, [buffer]); this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor("pcm-capture", PCMCapture);
