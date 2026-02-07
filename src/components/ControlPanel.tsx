"use client";

import React from 'react';
import { PadState } from '@/types/dj-pad';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/layout/SliderControl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Repeat, SlidersHorizontal, Palette, Info } from 'lucide-react';

interface ControlPanelProps {
  pad: PadState | null;
  onUpdate: (updates: Partial<PadState>) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ pad, onUpdate }) => {
  if (!pad) {
    return (
      <Card className="h-full border-dashed bg-card/20 flex flex-col items-center justify-center p-8 text-center">
        <Info className="text-muted-foreground mb-4 opacity-20" size={48} />
        <CardTitle className="text-muted-foreground">No Pad Selected</CardTitle>
        <CardDescription>Select a pad from the grid to customize its sound and behavior.</CardDescription>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border bg-card/40 backdrop-blur-sm overflow-auto">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Pad {pad.id + 1}
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: pad.color }} 
              />
            </CardTitle>
            <CardDescription>Configure sample settings</CardDescription>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
             <SlidersHorizontal size={18} className="text-primary" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 pt-6">
        {/* Loop Toggle */}
        <div className="flex items-center justify-between bg-secondary/50 p-4 rounded-xl border border-border/50">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Repeat size={16} /> Loop Sample
            </Label>
            <span className="text-xs text-muted-foreground">Repeat sound continuously</span>
          </div>
          <Switch 
            checked={pad.loop} 
            onCheckedChange={(checked) => onUpdate({ loop: checked })} 
          />
        </div>

        {/* Pitch Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Pitch / Speed</Label>
            <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-0.5 rounded">
              {pad.pitch.toFixed(2)}x
            </span>
          </div>
          <Slider 
            value={[pad.pitch * 100]} 
            min={50} 
            max={200} 
            step={1} 
            onValueChange={([val]) => onUpdate({ pitch: val / 100 })}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>Half</span>
            <span>Normal</span>
            <span>Double</span>
          </div>
        </div>

        {/* Bass Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Bass Boost (Low Shelf)</Label>
            <span className="text-xs font-mono bg-accent/20 text-accent px-2 py-0.5 rounded">
              {pad.bass > 0 ? `+${pad.bass}` : pad.bass} dB
            </span>
          </div>
          <Slider 
            value={[pad.bass]} 
            min={-20} 
            max={20} 
            step={1} 
            onValueChange={([val]) => onUpdate({ bass: val })}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>Cut</span>
            <span>Flat</span>
            <span>Boost</span>
          </div>
        </div>

        {/* Individual Volume Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Pad Volume</Label>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round(pad.volume * 100)}%
            </span>
          </div>
          <Slider 
            value={[pad.volume * 100]} 
            min={0} 
            max={100} 
            step={1} 
            onValueChange={([val]) => onUpdate({ volume: val / 100 })}
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette size={16} /> Pad Color
            </Label>
          </div>
          <div className="flex gap-4 items-center">
            <Input 
              type="color" 
              value={pad.color} 
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-12 h-12 p-1 bg-transparent border-none cursor-pointer"
            />
            <div className="flex-1">
              <Input 
                type="text" 
                value={pad.color} 
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="font-mono uppercase h-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};