'use client';

import { useRef, useState } from 'react';
import { AudioLines, ArrowUpRight, CircleHelp, Headphones, Keyboard, Music2, Pencil, Play, ShieldCheck, Square, Volume2, VolumeX, X } from 'lucide-react';
import { Slider } from '@/components/ui/layout/SliderControl';
import { Button } from '@/components/ui/button';
import { PadGrid } from '@/components/PadGrid';
import { ControlPanel } from '@/components/ControlPanel';
import { useDjPad } from '@/hooks/use-dj-pad';

export default function DJPadController() {
  const controller = useDjPad();
  const { pads, selectedPadId, masterVolume, setMasterVolume, ready, audioReady, message,
    setMessage, importing, playPad, stopPad, stopAll, updatePad, importSample, resetPad } = controller;
  const [editMode, setEditMode] = useState(false);
  const unmutedVolume = useRef(0.7);
  const controls = useRef<HTMLElement>(null);
  const loadedCount = pads.filter(pad => pad.sampleUrl).length;
  const activeCount = pads.filter(pad => pad.isActive).length;
  const selectedPad = pads[selectedPadId];

  function selectPad(id: number) {
    controller.setSelectedPadId(id);
    if ((editMode || !pads[id].sampleUrl) && window.matchMedia('(max-width: 1023px)').matches) {
      controls.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function toggleMute() {
    if (masterVolume > 0) { unmutedVolume.current = masterVolume; setMasterVolume(0); }
    else setMasterVolume(unmutedVolume.current);
  }

  return (
    <div className="studio-shell mx-auto min-h-screen max-w-[1440px] px-4 pb-6 sm:px-8 lg:px-12">
      <a href="#instrumento" className="skip-link">Ir para os pads</a>
      <header className="flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] py-5">
        <a href={process.env.NEXT_PUBLIC_BASE_PATH ? `${process.env.NEXT_PUBLIC_BASE_PATH}/` : '/'} className="flex items-center gap-3" aria-label="DJ Pad, início">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-background"><AudioLines size={24} aria-hidden="true" /></span>
          <span className="text-xl font-extrabold tracking-tight">DJ<span className="text-accent">PAD</span><span className="ml-2 align-top text-[9px] font-medium tracking-[0.2em] text-muted-foreground">STUDIO</span></span>
        </a>
        <div className="flex items-center gap-4 text-xs text-muted-foreground sm:gap-6">
          <span className="hidden items-center gap-2 sm:flex"><ShieldCheck size={14} aria-hidden="true" /> Sem conta. No seu navegador.</span>
          <a href="#como-usar" className="flex min-h-10 items-center gap-2 rounded-lg px-2 transition-colors hover:text-foreground"><CircleHelp size={16} aria-hidden="true" /> Como usar <ArrowUpRight size={12} aria-hidden="true" /></a>
        </div>
      </header>

      <main id="instrumento" tabIndex={-1} className="pb-8 pt-8 outline-none sm:pt-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Seu playground de sons</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Aperte o play na sua criatividade<span className="text-accent">.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Dispare samples, misture sons e crie do seu jeito. Pelo teclado ou com um toque.</p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground" role="status">
            <span className={`h-1.5 w-1.5 rounded-full ${audioReady ? 'bg-accent' : 'bg-muted-foreground'}`} />
            {!ready ? 'Abrindo biblioteca…' : audioReady ? 'Áudio ativado' : 'Toque em um pad para começar'}
          </span>
        </div>

        {message && (
          <div role="alert" aria-label="Aviso do estúdio" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            <p className="py-1">{message}</p>
            <Button onClick={() => setMessage(null)} variant="ghost" size="icon" aria-label="Fechar aviso" className="h-9 w-9 shrink-0"><X size={16} /></Button>
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="pads-title" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card/70">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <Music2 size={18} className="text-accent" aria-hidden="true" />
                <h2 id="pads-title" className="text-sm font-semibold">Seus pads</h2>
                <span className="rounded-md bg-secondary px-2 py-1 text-[10px] tabular-nums text-muted-foreground">{loadedCount} / 25</span>
              </div>
              <Button variant="ghost" size="sm" aria-pressed={editMode} onClick={() => setEditMode(value => !value)} className={`h-9 gap-2 text-xs ${editMode ? 'bg-accent/10 text-accent' : 'text-muted-foreground'}`}>
                {editMode ? <Pencil size={13} /> : <Play size={13} />} {editMode ? 'Modo edição' : 'Modo tocar'}
              </Button>
            </div>
            <div className="p-3 sm:p-5 xl:p-6">
              <PadGrid pads={pads} selectedPadId={selectedPadId} disabled={!ready} editMode={editMode}
                onPadPress={playPad} onPadSelect={selectPad} />
            </div>
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-[10px] text-muted-foreground sm:px-6 sm:text-xs">
              <span className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${activeCount ? 'bg-accent' : 'bg-muted-foreground/50'}`} /> {activeCount ? `${activeCount} ${activeCount === 1 ? 'som tocando' : 'sons tocando'}` : 'Tudo pronto para o próximo som'}</span>
              <span>{editMode ? 'Selecione um pad sem tocar' : 'Pads com + recebem seus sons'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-border bg-background/30 p-4 sm:px-6">
              <div className="flex min-w-[170px] flex-1 items-center gap-3">
                <button type="button" onClick={toggleMute} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={masterVolume ? 'Silenciar áudio' : 'Ativar volume'} aria-pressed={masterVolume === 0}>
                  {masterVolume ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex justify-between text-[10px]"><span className="font-medium text-muted-foreground">VOLUME GERAL</span><span className="tabular-nums">{Math.round(masterVolume * 100)}%</span></div>
                  <Slider aria-label="Volume geral" value={[masterVolume * 100]} min={0} max={100} step={1} onValueChange={([value]) => setMasterVolume(value / 100)} />
                </div>
              </div>
              <Button variant="outline" onClick={stopAll} className="h-11 gap-2 rounded-xl border-rose-400/25 bg-rose-400/5 text-xs text-rose-300 hover:bg-rose-400/15 hover:text-rose-200">
                <Square size={12} fill="currentColor" /> Parar tudo <kbd className="ml-2 hidden rounded border border-rose-400/20 px-1.5 py-0.5 text-[9px] sm:inline">ESC</kbd>
              </Button>
            </div>
          </section>

          <aside ref={controls} aria-label="Personalizar pad" className="min-w-0 scroll-mt-4">
            <ControlPanel pad={selectedPad} disabled={!ready} importing={importing}
              onUpdate={updates => updatePad(selectedPadId, updates)} onStop={() => stopPad(selectedPadId)}
              onImport={file => importSample(selectedPadId, file)} onReset={() => resetPad(selectedPadId)} />
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-border/60 px-4 py-3">
              <Headphones size={17} className="mt-0.5 shrink-0 text-accent/80" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">Comece com o volume baixo. Use fones para ouvir os detalhes da sua mistura.</p>
            </div>
          </aside>
        </div>

        <details id="como-usar" className="mt-6 rounded-xl border border-border bg-card/40 px-5 py-1 text-sm">
          <summary className="cursor-pointer py-4 font-medium"><span className="ml-2 inline-flex items-center gap-2"><Keyboard size={16} className="text-accent" aria-hidden="true" /> Do primeiro toque ao seu próprio set</span></summary>
          <div className="grid gap-5 pb-5 pt-2 text-xs leading-6 text-muted-foreground sm:grid-cols-3">
            <p><strong className="block text-foreground">01 / Toque e combine</strong>Clique nos pads ou use as teclas indicadas. Sons diferentes tocam juntos. Repetir um pad reinicia o som; um loop para no segundo toque.</p>
            <p><strong className="block text-foreground">02 / Deixe com a sua cara</strong>Ative o modo edição para selecionar sem tocar. Ajuste velocidade, graves, volume e cor. Importe áudios de até 20 MB e 2 minutos.</p>
            <p><strong className="block text-foreground">03 / Continue de onde parou</strong>Sons importados e ajustes ficam neste navegador. Limpar os dados do site remove sua biblioteca. Pressione Esc ou apóstrofo (&apos;) para parar tudo.</p>
          </div>
        </details>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5 text-[10px] text-muted-foreground">
        <span className="font-semibold tracking-wider">DJ<span className="text-accent">PAD</span> <span className="ml-2 font-normal tracking-normal">Espaço para experimentar.</span></span>
        <p>Seus áudios ficam neste dispositivo. Importe sons que você tem permissão para usar.</p>
      </footer>
    </div>
  );
}
