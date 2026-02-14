export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<number, Set<AudioBufferSourceNode>> = new Map();
  private filterNodes: Map<number, BiquadFilterNode> = new Map();
  private padGains: Map<number, GainNode> = new Map();
  private unlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
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
   * Aggressive unlock for iOS Safari
   */
  async unlock(): Promise<boolean> {
    if (!this.context) return false;
    
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch (e) {
        console.error('Failed to resume context:', e);
      }
    }

    // Play a silent buffer to kick the hardware into gear
    const buffer = this.context.createBuffer(1, 1, 22050);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start(0);
    
    this.unlocked = this.context.state === 'running';
    return this.unlocked;
  }

  private async resume() {
    if (this.context && this.context.state !== 'running') {
      try {
        await this.context.resume();
      } catch (e) {
        console.error('Resume failed:', e);
      }
    }
  }

  async triggerPad(id: number, url: string, settings: { pitch: number; bass: number; loop: boolean; volume: number }) {
    await this.resume();
    if (!this.context || !this.masterGain) return;

    let buffer = this.buffers.get(url);
    if (!buffer) {
      await this.loadSample(id, url);
      buffer = this.buffers.get(url);
      if (!buffer) return;
    }

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

    // Track multiple sources for the same pad to allow layering/rapid trigger
    if (!this.activeSources.has(id)) {
      this.activeSources.set(id, new Set());
    }
    this.activeSources.get(id)!.add(source);
    
    this.filterNodes.set(id, filter);
    this.padGains.set(id, padGain);

    source.onended = () => {
      const set = this.activeSources.get(id);
      if (set) {
        set.delete(source);
        if (set.size === 0) {
          this.activeSources.delete(id);
        }
      }
    };
  }

  stopPad(id: number) {
    const sources = this.activeSources.get(id);
    if (sources) {
      sources.forEach(s => {
        try { s.stop(); } catch (e) {}
      });
      this.activeSources.delete(id);
    }
    this.filterNodes.delete(id);
    this.padGains.delete(id);
  }

  stopAll() {
    this.activeSources.forEach((sources) => {
      sources.forEach(s => {
        try { s.stop(); } catch (e) {}
      });
    });
    this.activeSources.clear();
    this.filterNodes.clear();
    this.padGains.clear();
  }

  updatePadSettings(id: number, settings: { pitch: number; bass: number; loop: boolean; volume: number }) {
    if (!this.context) return;
    const sources = this.activeSources.get(id);
    const filter = this.filterNodes.get(id);
    const gain = this.padGains.get(id);

    if (sources) {
      sources.forEach(source => {
        source.playbackRate.setTargetAtTime(settings.pitch, this.context.currentTime!, 0.05);
        source.loop = settings.loop;
      });
    }
    if (filter) {
      filter.gain.setTargetAtTime(settings.bass, this.context.currentTime!, 0.05);
    }
    if (gain) {
       gain.gain.setTargetAtTime(settings.volume, this.context.currentTime!, 0.05);
    }
  }

  isReady() {
    return this.context?.state === 'running';
  }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
