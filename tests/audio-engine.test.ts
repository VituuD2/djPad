import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AudioEngine } from '../src/lib/audio-engine';

class Parameter {
  value = 0;
  setTargetAtTime(value: number) { this.value = value; }
}
class AudioNode {
  disconnected = false;
  connect() {}
  disconnect() { this.disconnected = true; }
}
class Source extends AudioNode {
  buffer: unknown;
  playbackRate = new Parameter();
  loop = false;
  onended: (() => void) | null = null;
  started = false;
  stopped = false;
  start() { this.started = true; }
  stop() { this.stopped = true; this.onended?.(); }
}
class Context {
  static instances: Context[] = [];
  state = 'suspended';
  currentTime = 0;
  destination = new AudioNode();
  sources: Source[] = [];
  gains: (AudioNode & { gain: Parameter })[] = [];
  constructor() { Context.instances.push(this); }
  async resume() { this.state = 'running'; }
  createGain() { const node = Object.assign(new AudioNode(), { gain: new Parameter() }); this.gains.push(node); return node; }
  createDynamicsCompressor() { return Object.assign(new AudioNode(), { threshold: new Parameter(), knee: new Parameter(), ratio: new Parameter(), attack: new Parameter(), release: new Parameter() }); }
  createBufferSource() { const source = new Source(); this.sources.push(source); return source; }
  createBiquadFilter() { return Object.assign(new AudioNode(), { type: '', frequency: new Parameter(), gain: new Parameter() }); }
  async decodeAudioData() { return { duration: 1 }; }
}

function setup() {
  Context.instances = [];
  Object.defineProperty(globalThis, 'window', { value: { AudioContext: Context }, configurable: true });
  const fetches: string[] = [];
  globalThis.fetch = async (url) => {
    fetches.push(String(url));
    return new Response(new ArrayBuffer(4));
  };
  return { engine: new AudioEngine(), fetches };
}
const settings = { pitch: 1, bass: 0, loop: false, volume: 0.8 };

test('creates audio lazily and applies master volume before the first playback', async () => {
  const { engine } = setup();
  engine.setMasterVolume(0.25);
  assert.equal(Context.instances.length, 0);
  await engine.triggerPad(0, '/sound.mp3', settings);
  assert.equal(Context.instances[0].gains[0].gain.value, 0.25);
  assert.equal(Context.instances[0].sources[0].started, true);
});

test('deduplicates downloads and caches decoded audio', async () => {
  const { engine, fetches } = setup();
  await Promise.all([engine.loadSample('/same.mp3'), engine.loadSample('/same.mp3')]);
  await engine.loadSample('/same.mp3');
  assert.equal(fetches.length, 1);
});

test('Stop All cancels playback waiting for a download', async () => {
  const { engine } = setup();
  let resolve!: (response: Response) => void;
  globalThis.fetch = () => new Promise<Response>(done => { resolve = done; });
  const pending = engine.triggerPad(0, '/slow.mp3', settings);
  // Wait until the download actually starts, then press Stop.
  while (!resolve) await Promise.resolve();
  engine.stopAll();
  resolve(new Response(new ArrayBuffer(4)));
  await pending;
  assert.equal(Context.instances[0].sources.length, 0);
});

test('retrigger stops and disconnects the previous voice; different pads play together', async () => {
  const { engine } = setup();
  await engine.triggerPad(0, '/sound.mp3', settings);
  const context = Context.instances[0];
  const first = context.sources[0];
  await engine.triggerPad(0, '/sound.mp3', settings);
  await engine.triggerPad(1, '/sound.mp3', settings);
  assert.equal(first.stopped, true);
  assert.equal(first.disconnected, true);
  assert.equal(context.sources[1].stopped, false);
  assert.equal(context.sources[2].stopped, false);
  engine.stopAll();
  assert.ok(context.sources.every(source => source.stopped && source.disconnected));
});

test('active indication follows the actual audio end and settings update live', async () => {
  const { engine } = setup();
  const events: { id: number; isActive?: boolean }[] = [];
  engine.subscribe(event => events.push(event));
  await engine.triggerPad(2, '/sound.mp3', settings);
  const context = Context.instances[0];
  const source = context.sources[0];
  engine.updatePadSettings(2, { ...settings, pitch: 1.5, volume: 0.3, loop: true });
  assert.equal(source.playbackRate.value, 1.5);
  assert.equal(source.loop, true);
  assert.equal(context.gains[1].gain.value, 0.3);
  assert.equal(events.at(-1)?.isActive, true);
  source.onended?.();
  assert.equal(events.at(-1)?.isActive, false);
  assert.equal(source.disconnected, true);
});

test('failed downloads surface an error and can be retried', async () => {
  const { engine } = setup();
  globalThis.fetch = async () => new Response(null, { status: 404 });
  await assert.rejects(engine.triggerPad(0, '/missing.mp3', settings), /carregar/);
  globalThis.fetch = async () => new Response(new ArrayBuffer(4));
  await engine.triggerPad(0, '/missing.mp3', settings);
  assert.equal(Context.instances[0].sources[0].started, true);
});
