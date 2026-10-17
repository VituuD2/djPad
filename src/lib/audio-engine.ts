import type { PadSettings, PadState } from '../types/dj-pad';

type Voice = { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode };
type PadEvent = { id: number; isActive?: boolean; status?: PadState['status'] };

/** One voice per pad. Different pads can play together; repeated hits restart a sound. */
export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer>>();
  private voices = new Map<number, Voice>();
  private requests = new Map<number, number>();
  private settings = new Map<number, PadSettings>();
  private listeners = new Set<(event: PadEvent) => void>();
  private masterVolume = 0.7;

  subscribe(listener: (event: PadEvent) => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(event: PadEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  private getContext() {
    if (!this.context) {
      const AudioCtx = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) throw new Error('Seu navegador não oferece suporte a áudio. Tente um navegador atualizado.');
      this.context = new AudioCtx({ latencyHint: 'interactive' });
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.masterVolume;
      const limiter = this.context.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.15;
      this.masterGain.connect(limiter);
      limiter.connect(this.context.destination);
    }
    return this.context;
  }

  async unlock() {
    const context = this.getContext();
    // Resume inside the user gesture, before fetching or decoding audio.
    try { if (context.state !== 'running') await context.resume(); }
    catch { throw new Error('Não foi possível ativar o áudio. Toque novamente ou recarregue a página.'); }
    if (context.state !== 'running') throw new Error('Toque novamente para ativar o áudio do navegador.');
  }

  async loadSample(url: string): Promise<AudioBuffer> {
    const cached = this.buffers.get(url);
    if (cached) return cached;
    const pending = this.loading.get(url);
    if (pending) return pending;
    const context = this.getContext();
    const task = (async () => {
      let response: Response;
      try { response = await fetch(url, { signal: AbortSignal.timeout(20_000) }); }
      catch { throw new Error('Não foi possível carregar esse som. Verifique sua conexão e tente novamente.'); }
      if (!response.ok) throw new Error('Não foi possível carregar esse som. Tente novamente.');
      let buffer: AudioBuffer;
      try { buffer = await context.decodeAudioData(await response.arrayBuffer()); }
      catch { throw new Error('Esse áudio não pôde ser aberto. Tente importar um arquivo MP3 ou WAV válido.'); }
      if (buffer.duration > 120) throw new Error('Use um áudio com até 2 minutos.');
      this.buffers.set(url, buffer);
      return buffer;
    })();
    this.loading.set(url, task);
    try { return await task; }
    finally { this.loading.delete(url); }
  }

  releaseSample(url: string) { this.buffers.delete(url); }

  setMasterVolume(value: number) {
    this.masterVolume = Math.min(1, Math.max(0, value));
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.context.currentTime, 0.015);
    }
  }

  async triggerPad(id: number, url: string, settings: PadSettings) {
    this.stopPad(id);
    this.settings.set(id, settings);
    const request = this.requests.get(id)!;
    this.emit({ id, status: 'loading' });
    try {
      await this.unlock();
      const buffer = await this.loadSample(url);
      // Cancel playback even when Stop was pressed before the download finished.
      if (this.requests.get(id) !== request) return;
      const context = this.getContext();
      const currentSettings = this.settings.get(id) ?? settings;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = currentSettings.pitch;
      source.loop = currentSettings.loop;
      const filter = context.createBiquadFilter();
      filter.type = 'lowshelf';
      filter.frequency.value = 200;
      filter.gain.value = currentSettings.bass;
      const gain = context.createGain();
      gain.gain.value = currentSettings.volume;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      const voice = { source, filter, gain };
      this.voices.set(id, voice);
      source.onended = () => {
        this.disconnect(voice);
        if (this.voices.get(id) === voice) {
          this.voices.delete(id);
          this.emit({ id, isActive: false });
        }
      };
      source.start();
      this.emit({ id, status: 'ready', isActive: true });
    } catch (error) {
      if (this.requests.get(id) !== request) return;
      this.emit({ id, status: 'error', isActive: false });
      throw error;
    }
  }

  private disconnect({ source, filter, gain }: Voice) {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  }

  stopPad(id: number) {
    this.requests.set(id, (this.requests.get(id) ?? 0) + 1);
    const voice = this.voices.get(id);
    if (voice) {
      this.voices.delete(id);
      voice.source.onended = null;
      voice.source.stop();
      this.disconnect(voice);
    }
    this.emit({ id, isActive: false });
  }

  stopAll() { this.requests.forEach((_, id) => this.stopPad(id)); }

  updatePadSettings(id: number, settings: PadSettings) {
    this.settings.set(id, settings);
    const voice = this.voices.get(id);
    if (!voice || !this.context) return;
    const time = this.context.currentTime;
    voice.source.playbackRate.setTargetAtTime(settings.pitch, time, 0.015);
    voice.source.loop = settings.loop;
    voice.filter.gain.setTargetAtTime(settings.bass, time, 0.015);
    voice.gain.gain.setTargetAtTime(settings.volume, time, 0.015);
  }
}

// No AudioContext is created during rendering or module evaluation.
export const audioEngine = new AudioEngine();
