import { DEFAULT_PAD_COLOR, type PadState } from '@/types/dj-pad';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const SOUNDS = [
  { label: 'Cê pagaria?', file: 'cepagaria.mp3', color: '#633db3' },
  { label: 'Cê prefere?', file: 'ceprefere.mp3', color: '#633db3' },
  { label: 'Fahh', file: 'fahh.mp3', color: '#633db3' },
  { label: 'Fahh Boost', file: 'fahh_boost.mp3', color: '#633db3' },
  { label: 'Tai Lung', file: 'tailung.mp3', color: '#245b78' },
  { label: 'See Me Fall', file: 'seeMeFall.mp3', color: '#245b78' },
  { label: 'Airhorn', file: 'airhorn.mp3', color: '#245b78' },
];
const SHORTCUTS = ['1', '2', '3', '4', '5', 'q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b', '6', '7', '8', '9', '0'];

export const INITIAL_PADS: PadState[] = Array.from({ length: 25 }, (_, id) => ({
  id,
  label: SOUNDS[id]?.label ?? `Pad ${id + 1}`,
  shortcut: SHORTCUTS[id],
  color: SOUNDS[id]?.color ?? DEFAULT_PAD_COLOR,
  pitch: 1,
  bass: 0,
  loop: false,
  volume: 0.8,
  sampleUrl: SOUNDS[id] ? `${basePath}/sounds/${SOUNDS[id].file}` : '',
  isActive: false,
  status: SOUNDS[id] ? 'idle' : 'empty',
}));

export const STORAGE_KEY = 'djpad-settings-v1';

export function restoreSettings(raw: string | null): { pads: PadState[]; masterVolume: number } {
  const defaults = { pads: INITIAL_PADS.map(pad => ({ ...pad })), masterVolume: 0.7 };
  if (!raw) return defaults;
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.pads)) return defaults;
    const number = (value: unknown, min: number, max: number, fallback: number) =>
      typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
    return {
      masterVolume: number(data.masterVolume, 0, 1, 0.7),
      pads: defaults.pads.map(pad => {
        const saved = data.pads[pad.id];
        if (!saved || typeof saved !== 'object') return pad;
        return {
          ...pad,
          label: typeof saved.label === 'string' && saved.label.trim() ? saved.label.slice(0, 32) : pad.label,
          color: typeof saved.color === 'string' && /^#[0-9a-f]{6}$/i.test(saved.color) ? saved.color : pad.color,
          pitch: number(saved.pitch, 0.5, 2, 1),
          bass: number(saved.bass, -20, 20, 0),
          volume: number(saved.volume, 0, 1, 0.8),
          loop: saved.loop === true,
        };
      }),
    };
  } catch { return defaults; }
}
