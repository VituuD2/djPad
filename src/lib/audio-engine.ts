export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<number, AudioBufferSourceNode> = new Map();
  private filterNodes: Map<number, BiquadFilterNode> = new Map();
  private padGains: Map<number, GainNode> = new Map();
  private allPlayingSources: Set<AudioBufferSourceNode> = new Set();
  private unlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.context = new AudioCtx();
          this.masterGain = this.context.createGain();
          this.masterGain.connect(this.context.destination);
        }
      } catch (e) {
        console.error('AudioContext not supported', e);
      }
    }
  }

  async loadSample(id: number, url: string) {
    if (!this.context) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(url, audioBuffer);
    } catch (e) {
      console.warn(`Failed to load sample: ${url}`, e);
    }
  }

  setMasterVolume(value: number) {
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    }
  }

  /**
   * Specifically for iOS Safari to unlock the AudioContext
   */
  async unlock() {
    if (this.unlocked || !this.context) return;

    // Create a silent buffer and play it to unlock the hardware
    const buffer = this.context.createBuffer(1, 1, 22050);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(0);

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    this.unlocked = true;
  }

  private async resume() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  async triggerPad(id: number, url: string, settings: { pitch: number; bass: number; loop: boolean; volume: number }) {
    await this.resume();
    if (!this.context || !this.masterGain) return;

    const buffer = this.buffers.get(url);
    if (!buffer) {
      // Fallback: try loading if missing, though it should be preloaded
      await this.loadSample(id, url);
      const reBuffer = this.buffers.get(url);
      if (!reBuffer) return;
    }

    const playBuffer = this.buffers.get(url)!;

    // Stop existing source for this specific pad to allow retriggering
    this.stopPad(id);

    const source = this.context.createBufferSource();
    source.buffer = playBuffer;
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

    // Track the source
    this.activeSources.set(id, source);
    this.filterNodes.set(id, filter);
    this.padGains.set(id, padGain);
    this.allPlayingSources.add(source);

    source.onended = () => {
      this.allPlayingSources.delete(source);
      if (this.activeSources.get(id) === source) {
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
      this.allPlayingSources.delete(source);
    }
    this.filterNodes.delete(id);
    this.padGains.delete(id);
  }

  stopAll() {
    this.allPlayingSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    
    this.allPlayingSources.clear();
    this.activeSources.clear();
    this.filterNodes.clear();
    this.padGains.clear();
  }

  updatePadSettings(id: number, settings: { pitch: number; bass: number; loop: boolean; volume: number }) {
    if (!this.context) return;
    const source = this.activeSources.get(id);
    const filter = this.filterNodes.get(id);
    const gain = this.padGains.get(id);

    if (source) {
      source.playbackRate.setTargetAtTime(settings.pitch, this.context.currentTime, 0.05);
      source.loop = settings.loop;
    }
    if (filter) {
      filter.gain.setTargetAtTime(settings.bass, this.context.currentTime, 0.05);
    }
    if (gain) {
       gain.gain.setTargetAtTime(settings.volume, this.context.currentTime, 0.05);
    }
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
