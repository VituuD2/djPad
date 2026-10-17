'use client';

import { AlertCircle, AudioLines, Loader2, Plus, Repeat } from 'lucide-react';
import type { PadState } from '@/types/dj-pad';
import { cn } from '@/lib/utils';

interface PadGridProps {
  pads: PadState[];
  selectedPadId: number;
  onPadPress: (id: number) => void;
  onPadSelect: (id: number) => void;
  disabled: boolean;
  editMode: boolean;
}

export function PadGrid({ pads, selectedPadId, onPadPress, onPadSelect, disabled, editMode }: PadGridProps) {
  return (
    <div className="mx-auto grid w-full max-w-[620px] grid-cols-5 gap-2 sm:gap-3" aria-label="Mesa de 25 pads">
      {pads.map(pad => (
        <button type="button" key={pad.id} disabled={disabled}
          onClick={() => { onPadSelect(pad.id); if (!editMode && pad.sampleUrl) onPadPress(pad.id); }}
          aria-label={pad.sampleUrl ? `${pad.label}, pad ${pad.id + 1}, tecla ${pad.shortcut}${pad.isActive ? ', tocando' : ''}` : `Pad ${pad.id + 1} vazio. Importar som. Tecla ${pad.shortcut}`}
          aria-pressed={selectedPadId === pad.id} aria-keyshortcuts={pad.shortcut}
          data-active={pad.isActive} data-pad-id={pad.id}
          className={cn('dj-pad group relative flex aspect-square min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border p-1.5 transition duration-100 sm:gap-3 sm:p-3',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-wait disabled:opacity-40',
            pad.sampleUrl ? 'border-white/10 shadow-[inset_0_1px_0_0_#ffffff12] hover:brightness-125 active:scale-95' : 'border-dashed border-white/10 bg-background/30 text-muted-foreground hover:border-accent/50 hover:bg-accent/5 hover:text-accent',
            selectedPadId === pad.id && 'ring-2 ring-accent ring-offset-2 ring-offset-card',
            pad.isActive && 'pad-active')}
          style={pad.sampleUrl ? { backgroundColor: pad.color } : undefined}>
          <span className="absolute left-2 top-1.5 hidden text-[9px] font-medium tabular-nums text-white/45 sm:block">{String(pad.id + 1).padStart(2, '0')}</span>
          <span className="absolute right-1.5 top-1.5 hidden rounded bg-black/20 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white/70 sm:block">{pad.shortcut}</span>
          {pad.status === 'loading' ? <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            : pad.status === 'error' ? <AlertCircle size={18} className="text-amber-200" aria-hidden="true" />
            : pad.sampleUrl ? <AudioLines size={22} className={cn('hidden sm:block', pad.isActive ? 'text-accent' : 'text-white/60')} aria-hidden="true" />
            : <Plus size={19} className="opacity-40 transition-opacity group-hover:opacity-100" aria-hidden="true" />}
          <span className={cn('line-clamp-2 w-full break-words text-center text-[9px] font-medium leading-tight sm:text-[11px] xl:text-xs', pad.sampleUrl && 'text-white')}>{pad.sampleUrl ? pad.label : <><span className="sm:hidden">{pad.id + 1}</span><span className="hidden sm:inline">Adicionar som</span></>}</span>
          {pad.loop && <Repeat size={11} className={cn('absolute bottom-1.5 right-1.5', pad.isActive ? 'text-accent' : 'text-white/60')} aria-label="Loop ativado" />}
          {pad.isActive && <span className="absolute bottom-2 left-2 h-1 w-1 rounded-full bg-accent" />}
        </button>
      ))}
    </div>
  );
}
