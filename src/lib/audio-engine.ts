export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<number, AudioBufferSourceNode> = new Map();
  private filterNodes: Map<number, BiquadFilterNode> = new Map();
  private padGains: Map<number, GainNode> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
    }
  }

  async loadSample(id: number, url: string) {
    if (!this.context) return;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(url, audioBuffer);
    } catch (e) {
      console.error(`Failed to load sample: ${url}`, e);
    }
  }

  setMasterVolume(value: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, this.context?.currentTime || 0, 0.05);
    }
  }

  private resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  triggerPad(id: number, url: string, settings: { pitch: number; bass: number; loop: boolean; volume: number }) {
    this.resume();
    if (!this.context || !this.masterGain) return;

    const buffer = this.buffers.get(url);
    if (!buffer) return;

    // Stop existing if any
    this.stopPad(id);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = settings.pitch;
    source.loop = settings.loop;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowshelf';
    filter.frequency.value = 200;
    filter.gain.value = settings.bass;

    const padGain = this.context.createGain();
    padGain.gain.value = settings.volume;

    source.connect(filter);
    filter.connect(padGain);
    padGain.connect(this.masterGain);

    source.start(0);

    this.activeSources.set(id, source);
    this.filterNodes.set(id, filter);
    this.padGains.set(id, padGain);

    source.onended = () => {
      if (!source.loop) {
        this.activeSources.delete(id);
      }
    };
  }

  stopPad(id: number) {
    const source = this.activeSources.get(id);
    if (source) {
      try {
        source.stop();
      } catch (e) {}
      this.activeSources.delete(id);
    }
    this.filterNodes.delete(id);
    this.padGains.delete(id);
  }

  stopAll() {
    this.activeSources.forEach((source, id) => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.activeSources.clear();
    this.filterNodes.clear();
    this.padGains.clear();
  }

  updatePadSettings(id: number, settings: { pitch: number; bass: number; loop: boolean; volume: number }) {
    const source = this.activeSources.get(id);
    const filter = this.filterNodes.get(id);
    const gain = this.padGains.get(id);

    if (source) {
      source.playbackRate.setTargetAtTime(settings.pitch, this.context?.currentTime || 0, 0.05);
      source.loop = settings.loop;
    }
    if (filter) {
      filter.gain.setTargetAtTime(settings.bass, this.context?.currentTime || 0, 0.05);
    }
    if (gain) {
       gain.gain.setTargetAtTime(settings.volume, this.context?.currentTime || 0, 0.05);
    }
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
