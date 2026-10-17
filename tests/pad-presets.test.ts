import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { INITIAL_PADS, restoreSettings } from '../src/lib/pad-presets';

test('all 25 pads have unique shortcuts and every bundled sound exists', () => {
  assert.equal(INITIAL_PADS.length, 25);
  assert.equal(new Set(INITIAL_PADS.map(pad => pad.shortcut)).size, 25);
  assert.equal(INITIAL_PADS.filter(pad => pad.sampleUrl).length, 7);
  for (const pad of INITIAL_PADS) {
    if (pad.sampleUrl) {
      const relativeUrl = pad.sampleUrl.replace(process.env.NEXT_PUBLIC_BASE_PATH ?? '', '');
      assert.ok(existsSync(join(process.cwd(), 'public', relativeUrl)), relativeUrl);
    } else assert.equal(pad.status, 'empty');
  }
});

test('corrupt and incompatible saved data recover to defaults', () => {
  for (const raw of ['{broken', 'null', '{}', '{"version":99}', '[]']) {
    assert.deepEqual(restoreSettings(raw), restoreSettings(null));
  }
});

test('restoration validates settings and never trusts saved sample URLs or playback state', () => {
  const result = restoreSettings(JSON.stringify({ version: 1, masterVolume: 8, pads: [{
    color: 'invalid', pitch: -1, volume: 'loud', bass: 999, loop: 'yes', label: 'a'.repeat(100),
    sampleUrl: 'https://untrusted.example/track.mp3', isActive: true, id: 999,
  }] }));
  assert.equal(result.masterVolume, 1);
  assert.equal(result.pads[0].pitch, 0.5);
  assert.equal(result.pads[0].volume, 0.8);
  assert.equal(result.pads[0].bass, 20);
  assert.equal(result.pads[0].loop, false);
  assert.equal(result.pads[0].label.length, 32);
  assert.equal(result.pads[0].color, INITIAL_PADS[0].color);
  assert.equal(result.pads[0].sampleUrl, INITIAL_PADS[0].sampleUrl);
  assert.equal(result.pads[0].isActive, false);
  assert.equal(result.pads[0].id, 0);
});
