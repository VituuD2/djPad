"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Slider } from "@/components/ui/layout/SliderControl";
import { PadGrid } from "@/components/PadGrid";
import { ControlPanel } from "@/components/ControlPanel";
import { PadState, DEFAULT_PAD_COLOR } from "@/types/dj-pad";
import { audioEngine } from "@/lib/audio-engine";
import { Volume2, Music, Power } from 'lucide-react';

const SOUND_MAPPING = [
  { label: 'Cepagaria', url: '/sounds/cepagaria.mp3' },
  { label: 'Ceprefere', url: '/sounds/ceprefere.mp3' },
  { label: 'Fahh', url: '/sounds/fahh.mp3' },
  { label: 'Tailung', url: '/sounds/tailung.mp3' },
];

const INITIAL_PADS: PadState[] = Array.from({ length: 25 }, (_, i) => {
  const customSound = SOUND_MAPPING[i];
  return {
    id: i,
    label: customSound ? customSound.label : `${i + 1}`,
    color: customSound ? '#9C27B0' : DEFAULT_PAD_COLOR, // Distinct color for active pads
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

  // Pre-load all samples on mount
  useEffect(() => {
    if (audioEngine) {
      pads.forEach(pad => {
        audioEngine.loadSample(pad.id, pad.sampleUrl);
      });
    }
  }, []);

  useEffect(() => {
    if (audioEngine) {
      audioEngine.setMasterVolume(masterVolume);
    }
  }, [masterVolume]);

  const handlePadPress = useCallback((id: number) => {
    if (!isInitialized) setIsInitialized(true);
    
    setPads(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: true } : p
    ));

    const pad = pads[id];
    audioEngine?.triggerPad(id, pad.sampleUrl, {
      pitch: pad.pitch,
      bass: pad.bass,
      loop: pad.loop,
      volume: pad.volume,
    });

    // Reset visual active state after brief delay unless looping
    if (!pad.loop) {
      setTimeout(() => {
        setPads(prev => prev.map(p => 
          p.id === id ? { ...p, isActive: false } : p
        ));
      }, 150);
    }
  }, [pads, isInitialized]);

  const handlePadStop = useCallback((id: number) => {
    audioEngine?.stopPad(id);
    setPads(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: false } : p
    ));
  }, []);

  const updatePadSettings = useCallback((id: number, updates: Partial<PadState>) => {
    setPads(prev => {
      const newPads = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      const updatedPad = newPads[id];
      audioEngine?.updatePadSettings(id, {
        pitch: updatedPad.pitch,
        bass: updatedPad.bass,
        loop: updatedPad.loop,
        volume: updatedPad.volume,
      });
      return newPads;
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl">
            <Music className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DJ Pad Controller
          </h1>
        </div>

        <div className="flex items-center gap-6 bg-card/50 p-3 rounded-2xl border border-border shadow-inner min-w-[300px]">
          <Volume2 className="text-muted-foreground shrink-0" size={20} />
          <div className="flex-1 px-2">
            <Slider 
              value={[masterVolume * 100]} 
              max={100} 
              step={1} 
              onValueChange={([val]) => setMasterVolume(val / 100)}
            />
          </div>
          <span className="text-sm font-mono text-muted-foreground w-8">{Math.round(masterVolume * 100)}%</span>
        </div>
      </header>

      {/* Main Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Grid Area */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center">
          <PadGrid 
            pads={pads} 
            selectedPadId={selectedPadId}
            onPadPress={handlePadPress}
            onPadStop={handlePadStop}
            onPadSelect={setSelectedPadId}
          />
          {!isInitialized && (
            <div className="mt-8 flex items-center gap-2 text-accent animate-bounce">
              <Power size={18} />
              <p className="text-sm font-medium">Click any pad to start audio engine</p>
            </div>
          )}
        </section>

        {/* Control Panel Area */}
        <aside className="lg:col-span-5 xl:col-span-4 h-full">
          <ControlPanel 
            pad={selectedPad} 
            onUpdate={(updates) => selectedPadId !== null && updatePadSettings(selectedPadId, updates)}
          />
        </aside>
      </main>

      {/* Footer Instructions */}
      <footer className="text-center text-xs text-muted-foreground pt-4 opacity-50">
        <p>Built for performance. Low latency Web Audio API. Custom sounds linked to pads 1-4.</p>
      </footer>
    </div>
  );
}
