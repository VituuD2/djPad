"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Slider } from "@/components/ui/layout/SliderControl";
import { PadGrid } from "@/components/PadGrid";
import { ControlPanel } from "@/components/ControlPanel";
import { PadState, DEFAULT_PAD_COLOR } from "@/types/dj-pad";
import { audioEngine } from "@/lib/audio-engine";
import { Volume2, Music, Power, Square } from 'lucide-react';
import { Button } from "@/components/ui/button";

const SOUND_MAPPING = [
  { label: 'Cepagaria', url: '/sounds/cepagaria.mp3' },
  { label: 'Ceprefere', url: '/sounds/ceprefere.mp3' },
  { label: 'Fahh', url: '/sounds/fahh.mp3' },
  { label: 'Tailung', url: '/sounds/tailung.mp3' },
  { label: 'seeMeFall', url: '/sounds/seeMeFall.mp3'},
  { label: 'Airhorn', url: '/sounds/airhorn.mp3'}
];

const KEY_SHORTCUTS = [
  "1", "2", "3", "4", "5",
  "q", "w", "e", "r", "t",
  "a", "s", "d", "f", "g",
  "z", "x", "c", "v", "b"
];

const INITIAL_PADS: PadState[] = Array.from({ length: 25 }, (_, i) => {
  const customSound = SOUND_MAPPING[i];
  return {
    id: i,
    label: customSound ? customSound.label : `${i + 1}`,
    shortcut: KEY_SHORTCUTS[i] || "",
    color: customSound ? '#9C27B0' : DEFAULT_PAD_COLOR,
    pitch: 1.0,
    bass: 0,
    loop: false,
    volume: 0.8,
    sampleUrl: customSound ? customSound.url : `/sounds/sample${(i % 5) + 1}.mp3`,
    isActive: false,
  };
});

export default function DJPadController() {
  const [pads, setPads] = useState<PadState[]>(INITIAL_PADS);
  const [selectedPadId, setSelectedPadId] = useState<number | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedPad = selectedPadId !== null ? pads[selectedPadId] : null;

  useEffect(() => {
    const engine = audioEngine;
    if (engine) {
      pads.forEach(pad => {
        engine.loadSample(pad.id, pad.sampleUrl);
      });
    }
  }, []);

  useEffect(() => {
    const engine = audioEngine;
    if (engine) {
      engine.setMasterVolume(masterVolume);
    }
  }, [masterVolume]);

  const handlePadStop = useCallback((id: number) => {
    const engine = audioEngine;
    if (engine) {
      engine.stopPad(id);
    }
    setPads(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: false } : p
    ));
  }, []);

  const handlePadPress = useCallback(async (id: number) => {
    const engine = audioEngine;
    if (!engine) return;

    if (!isInitialized) {
      // Very important for iOS: we must await the unlock inside the user interaction call stack
      const success = await engine.unlock();
      if (success) {
        setIsInitialized(true);
      }
    }
    
    if (id < 0 || id >= pads.length) return;

    setPads(prev => {
      const pad = prev[id];
      
      if (pad.isActive) {
        engine.stopPad(id);
        return prev.map(p => p.id === id ? { ...p, isActive: false } : p);
      }

      engine.triggerPad(id, pad.sampleUrl, {
        pitch: pad.pitch,
        bass: pad.bass,
        loop: pad.loop,
        volume: pad.volume,
      });

      const nextPads = prev.map(p => p.id === id ? { ...p, isActive: true } : p);

      if (!pad.loop) {
        setTimeout(() => {
          setPads(current => current.map(p => 
            p.id === id ? { ...p, isActive: false } : p
          ));
        }, 150);
      }

      return nextPads;
    });
  }, [isInitialized, pads]);

  const stopAllPads = useCallback(() => {
    const engine = audioEngine;
    if (engine) {
      engine.stopAll();
    }
    setPads(prev => prev.map(p => ({ ...p, isActive: false })));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (e.key === "'") {
        e.preventDefault();
        stopAllPads();
        return;
      }

      const padIndex = pads.findIndex(p => p.shortcut === key);
      if (padIndex !== -1) {
        e.preventDefault();
        setSelectedPadId(padIndex);
        handlePadPress(padIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pads, handlePadPress, stopAllPads]);

  const updatePadSettings = useCallback((id: number, updates: Partial<PadState>) => {
    setPads(prev => {
      const newPads = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      const updatedPad = newPads[id];
      const engine = audioEngine;
      if (engine) {
        engine.updatePadSettings(id, {
          pitch: updatedPad.pitch,
          bass: updatedPad.bass,
          loop: updatedPad.loop,
          volume: updatedPad.volume,
        });
      }
      return newPads;
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-3 sm:p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 md:pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shrink-0">
            <Music className="text-white h-5 w-5 md:h-6 md:w-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DJ Pad Controller
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-4 bg-card/50 p-2 md:p-3 rounded-2xl border border-border shadow-inner w-full md:min-w-[300px]">
            <Volume2 className="text-muted-foreground shrink-0" size={18} />
            <div className="flex-1 px-1">
              <Slider 
                value={[masterVolume * 100]} 
                max={100} 
                step={1} 
                onValueChange={([val]) => setMasterVolume(val / 100)}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-8 text-right">{Math.round(masterVolume * 100)}%</span>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={stopAllPads}
            className="w-full sm:w-auto flex items-center gap-2 rounded-xl h-10 md:h-12 px-6"
          >
            <Square size={16} fill="currentColor" />
            Stop All ( ' )
          </Button>
        </div>
      </header>

      <main className="flex flex-col lg:grid lg:grid-cols-12 gap-6 md:gap-8 flex-1">
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-start lg:justify-center min-h-[400px]">
          <PadGrid 
            pads={pads} 
            selectedPadId={selectedPadId}
            onPadPress={handlePadPress}
            onPadStop={handlePadStop}
            onPadSelect={setSelectedPadId}
          />
          {!isInitialized && (
            <div className="mt-6 flex items-center gap-2 text-accent animate-pulse">
              <Power size={16} />
              <p className="text-xs md:text-sm font-medium text-center">Touch any pad to activate audio engine</p>
            </div>
          )}
        </section>

        <aside className="lg:col-span-5 xl:col-span-4 h-full pb-8">
          <ControlPanel 
            pad={selectedPad} 
            onUpdate={(updates) => selectedPadId !== null && updatePadSettings(selectedPadId, updates)}
            onStop={() => selectedPadId !== null && handlePadStop(selectedPadId)}
          />
        </aside>
      </main>

      <footer className="hidden sm:block text-center text-[10px] text-muted-foreground pt-2 opacity-50">
        <p>Pro Engine • Low Latency • Global Stop (Press ') • Keyboard Shortcuts Enabled</p>
      </footer>
    </div>
  );
}