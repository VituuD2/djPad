export interface PadState {
  id: number;
  label: string;
  shortcut?: string;
  color: string;
  pitch: number; // 0.5 to 2.0
  bass: number; // -20 to 20 dB
  loop: boolean;
  volume: number; // 0 to 1
  sampleUrl: string;
  isActive: boolean;
}

export const DEFAULT_PAD_COLOR = '#673AB7'; // Deep Purple
