'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioEngine } from '@/lib/audio-engine';
import { INITIAL_PADS, restoreSettings, STORAGE_KEY } from '@/lib/pad-presets';
import { readSamples, saveSample } from '@/lib/sample-storage';
import type { PadState } from '@/types/dj-pad';

export function useDjPad() {
  const [pads, setPads] = useState(INITIAL_PADS);
  const padsRef = useRef(pads);
  const [selectedPadId, setSelectedPadId] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [ready, setReady] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const objectUrls = useRef(new Set<string>());
  const mounted = useRef(false);

  const replacePads = useCallback((update: (previous: PadState[]) => PadState[]) => {
    const next = update(padsRef.current);
    padsRef.current = next;
    setPads(next);
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    const unsubscribe = audioEngine.subscribe(({ id, ...updates }) => {
      replacePads(previous => previous.map(pad => pad.id === id ? { ...pad, ...updates } : pad));
    });
    void (async () => {
      let restored = restoreSettings(null);
      try { restored = restoreSettings(localStorage.getItem(STORAGE_KEY)); }
      catch { setMessage('O navegador bloqueou o salvamento. Você ainda pode tocar nesta sessão.'); }
      try {
        const samples = await readSamples();
        if (cancelled) return;
        restored.pads = restored.pads.map(pad => {
          const sample = samples.get(pad.id);
          if (!sample) return pad;
          const url = URL.createObjectURL(sample);
          objectUrls.current.add(url);
          return { ...pad, sampleUrl: url, custom: true, status: 'idle' };
        });
      } catch {
        if (!cancelled) setMessage('A biblioteca local está indisponível. Importações podem durar apenas esta sessão.');
      }
      if (cancelled) return;
      replacePads(() => restored.pads);
      setMasterVolume(restored.masterVolume);
      setReady(true);
    })();
    const urls = objectUrls.current;
    return () => {
      cancelled = true;
      mounted.current = false;
      audioEngine.stopAll();
      unsubscribe();
      urls.forEach(url => { URL.revokeObjectURL(url); audioEngine.releaseSample(url); });
      urls.clear();
    };
  }, [replacePads]);

  useEffect(() => { audioEngine.setMasterVolume(masterVolume); }, [masterVolume]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          version: 1,
          masterVolume,
          pads: pads.map(({ label, color, pitch, bass, loop, volume }) => ({ label, color, pitch, bass, loop, volume })),
        }));
      } catch { setMessage('Não foi possível salvar os ajustes. Verifique o espaço e as permissões do navegador.'); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pads, masterVolume, ready]);

  const stopPad = useCallback((id: number) => {
    audioEngine.stopPad(id);
    replacePads(previous => previous.map(pad => pad.id === id
      ? { ...pad, isActive: false, status: pad.status === 'loading' ? 'idle' : pad.status } : pad));
  }, [replacePads]);

  const stopAll = useCallback(() => {
    audioEngine.stopAll();
    replacePads(previous => previous.map(pad => ({ ...pad, isActive: false, status: pad.status === 'loading' ? 'idle' : pad.status })));
  }, [replacePads]);

  const playPad = useCallback(async (id: number) => {
    if (!ready) return;
    const pad = padsRef.current[id];
    if (!pad) return;
    setSelectedPadId(id);
    if (!pad.sampleUrl) return;
    if (pad.isActive && pad.loop) { stopPad(id); return; }
    setMessage(null);
    try {
      await audioEngine.triggerPad(id, pad.sampleUrl, pad);
      if (mounted.current) setAudioReady(true);
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'Não foi possível tocar esse áudio.');
    }
  }, [ready, stopPad]);

  const updatePad = useCallback((id: number, updates: Partial<PadState>) => {
    const pad = padsRef.current[id];
    if (!pad) return;
    const next = { ...pad, ...updates };
    audioEngine.updatePadSettings(id, next);
    replacePads(previous => previous.map(item => item.id === id ? next : item));
  }, [replacePads]);

  const importSample = useCallback(async (id: number, file: File) => {
    if (importing || !ready) return;
    if (!/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name) || (file.type && !file.type.startsWith('audio/'))) {
      setMessage('Escolha um arquivo de áudio MP3, WAV, OGG, M4A, AAC, FLAC ou WebM.');
      return;
    }
    if (!file.size || file.size > 20 * 1024 * 1024) {
      setMessage('Escolha um áudio de até 20 MB, com até 2 minutos.');
      return;
    }
    setImporting(true);
    setMessage(null);
    const url = URL.createObjectURL(file);
    let retained = false;
    try {
      await audioEngine.unlock();
      await audioEngine.loadSample(url);
      if (!mounted.current) return;
      // Persist before swapping the sound so a reload never restores a stale import.
      let saved = true;
      try { await saveSample(id, file); }
      catch { saved = false; }
      if (!mounted.current) return;
      stopPad(id);
      const previous = padsRef.current[id];
      if (previous.custom) {
        URL.revokeObjectURL(previous.sampleUrl);
        audioEngine.releaseSample(previous.sampleUrl);
        objectUrls.current.delete(previous.sampleUrl);
      }
      objectUrls.current.add(url);
      retained = true;
      updatePad(id, { sampleUrl: url, custom: true, label: file.name.replace(/\.[^.]+$/, '').slice(0, 32), status: 'ready' });
      setAudioReady(true);
      if (!saved) setMessage('Som importado para esta sessão. O navegador não permitiu salvá-lo para depois.');
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error && error.message.includes('2 minutos')
        ? error.message : 'Não foi possível abrir esse áudio. Tente um arquivo MP3 ou WAV válido.');
    } finally {
      if (!retained) { URL.revokeObjectURL(url); audioEngine.releaseSample(url); }
      if (mounted.current) setImporting(false);
    }
  }, [importing, ready, stopPad, updatePad]);

  const resetPad = useCallback(async (id: number) => {
    if (importing) return;
    const previous = padsRef.current[id];
    if (previous.custom) {
      try { await saveSample(id, null); }
      catch { setMessage('Não foi possível remover o som salvo. Tente novamente.'); return; }
    }
    stopPad(id);
    if (previous.custom) {
      URL.revokeObjectURL(previous.sampleUrl);
      audioEngine.releaseSample(previous.sampleUrl);
      objectUrls.current.delete(previous.sampleUrl);
    }
    replacePads(pads => pads.map(pad => pad.id === id ? { ...INITIAL_PADS[id] } : pad));
  }, [importing, replacePads, stopPad]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      // Escape remains available as a panic stop while editing a field.
      if (event.key === 'Escape') { event.preventDefault(); stopAll(); return; }
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [role="slider"], [role="switch"], [role="dialog"]'))) return;
      if (event.key === "'") { event.preventDefault(); stopAll(); return; }
      const pad = padsRef.current.find(pad => pad.shortcut === event.key.toLowerCase());
      if (pad) { event.preventDefault(); void playPad(pad.id); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playPad, stopAll]);

  return { pads, selectedPadId, setSelectedPadId, masterVolume, setMasterVolume, ready, audioReady,
    message, setMessage, importing, playPad, stopPad, stopAll, updatePad, importSample, resetPad };
}
