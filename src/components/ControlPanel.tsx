'use client';

import { useRef } from 'react';
import { Palette, Repeat, RotateCcw, SlidersHorizontal, Square, Upload } from 'lucide-react';
import type { PadState } from '@/types/dj-pad';
import { Slider } from '@/components/ui/layout/SliderControl';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ControlPanelProps {
  pad: PadState;
  disabled: boolean;
  importing: boolean;
  onUpdate: (updates: Partial<PadState>) => void;
  onStop: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

const COLORS = ['#633db3', '#245b78', '#23604d', '#8b3b65', '#855326', '#4b5563'];

export function ControlPanel({ pad, disabled, importing, onUpdate, onStop, onImport, onReset }: ControlPanelProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const hasSound = Boolean(pad.sampleUrl);
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card/70" aria-labelledby="controls-title">
      <div className="flex items-center justify-between border-b border-border px-5 py-5">
        <h2 id="controls-title" className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={16} className="text-accent" aria-hidden="true" /> Personalizar pad</h2>
        <span className="font-mono text-[11px] text-muted-foreground">{String(pad.id + 1).padStart(2, '0')}</span>
      </div>
      <fieldset disabled={disabled || importing} className="min-w-0 space-y-5 p-5 disabled:opacity-60">
        <legend className="sr-only">Ajustes do pad {pad.id + 1}</legend>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 font-mono text-sm font-semibold uppercase text-white" style={{ backgroundColor: pad.color }}>{pad.shortcut}</span>
          <div className="min-w-0 flex-1">
            <Label htmlFor="pad-name" className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">Nome do pad</Label>
            <Input id="pad-name" maxLength={32} value={pad.label} onChange={event => onUpdate({ label: event.target.value })} className="h-8 rounded-md border-transparent bg-background/50 px-2 text-sm font-medium" />
          </div>
          <Button variant="ghost" size="icon" onClick={onStop} disabled={!pad.isActive && pad.status !== 'loading'} aria-label="Parar pad selecionado" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-rose-300"><Square size={14} fill="currentColor" /></Button>
        </div>

        <div>
          <input ref={fileInput} type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm" className="sr-only" tabIndex={-1} aria-label="Arquivo de áudio para o pad" disabled={disabled || importing}
            onChange={event => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ''; }} />
          <Button variant="outline" className="h-10 w-full gap-2 rounded-lg border-dashed border-accent/30 bg-accent/5 text-xs text-accent hover:bg-accent/10 hover:text-accent" onClick={() => fileInput.current?.click()}><Upload size={14} />{importing ? 'Importando áudio…' : hasSound ? 'Substituir som' : 'Importar meu som'}</Button>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Até 20 MB e 2 min. Salvo só neste navegador.</p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-3">
          <div><Label htmlFor="pad-loop" className="flex items-center gap-2 text-xs font-medium"><Repeat size={13} className="text-accent" aria-hidden="true" /> Repetir em loop</Label><p className="mt-1 text-[10px] text-muted-foreground">Toque novamente para parar</p></div>
          <Switch id="pad-loop" checked={pad.loop} onCheckedChange={loop => onUpdate({ loop })} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs"><Label className="text-xs text-muted-foreground">Velocidade / tom</Label><output className="rounded bg-accent/10 px-2 py-1 font-mono text-[10px] text-accent">{pad.pitch.toFixed(2)}×</output></div>
          <Slider disabled={disabled || importing} aria-label="Velocidade do pad" value={[pad.pitch * 100]} min={50} max={200} step={1} onValueChange={([value]) => onUpdate({ pitch: value / 100 })} />
          <div className="flex justify-between text-[9px] text-muted-foreground"><span>0,5×</span><span>2×</span></div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs"><Label className="text-xs text-muted-foreground">Graves</Label><output className="font-mono text-[10px]">{pad.bass > 0 ? '+' : ''}{pad.bass} dB</output></div>
          <Slider disabled={disabled || importing} aria-label="Graves do pad" value={[pad.bass]} min={-20} max={20} step={1} onValueChange={([bass]) => onUpdate({ bass })} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs"><Label className="text-xs text-muted-foreground">Volume do pad</Label><output className="font-mono text-[10px]">{Math.round(pad.volume * 100)}%</output></div>
          <Slider disabled={disabled || importing} aria-label="Volume do pad" value={[pad.volume * 100]} min={0} max={100} step={1} onValueChange={([value]) => onUpdate({ volume: value / 100 })} />
        </div>

        <div className="border-t border-border pt-4">
          <Label htmlFor="pad-color" className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Palette size={13} aria-hidden="true" /> Cor do pad</Label>
          <div className="flex items-center justify-between gap-1">
            {COLORS.map(color => <button key={color} type="button" aria-label={`Usar cor ${color}`} aria-pressed={pad.color.toLowerCase() === color} onClick={() => onUpdate({ color })} className="flex h-10 w-9 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><span className={`h-6 w-6 rounded-full border-2 ${pad.color.toLowerCase() === color ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} /></button>)}
            <Input id="pad-color" type="color" value={pad.color} onChange={event => onUpdate({ color: event.target.value })} className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border-border bg-transparent p-1" />
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" className="h-9 w-full gap-2 text-[11px] text-muted-foreground"><RotateCcw size={12} /> Restaurar este pad</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Restaurar o pad {pad.id + 1}?</AlertDialogTitle><AlertDialogDescription>O som importado e os ajustes deste pad serão removidos. O pad voltará à configuração inicial.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onReset}>Restaurar pad</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </fieldset>
    </section>
  );
}
