"use client";

import React from 'react';
import { PadState } from '@/types/dj-pad';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/layout/SliderControl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Repeat, SlidersHorizontal, Palette, Info, Square } from 'lucide-react';

interface ControlPanelProps {
  pad: PadState | null;
  onUpdate: (updates: Partial<PadState>) => void;
  onStop: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ pad, onUpdate, onStop }) => {
  if (!pad) {
    return (
      <Card className="h-full border-dashed bg-card/20 flex flex-col items-center justify-center p-6 md:p-8 text-center min-h-[200px]">
        <Info className="text-muted-foreground mb-4 opacity-20" size={32} />
        <CardTitle className="text-sm md:text-base text-muted-foreground">No Pad Selected</CardTitle>
        <CardDescription className="text-xs">Select a pad to customize behavior.</CardDescription>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border bg-card/40 backdrop-blur-sm">
      <CardHeader className="border-b border-border/50 pb-3 md:pb-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              Pad {pad.id + 1}
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: pad.color }} 
              />
            </CardTitle>
            <CardDescription className="text-xs">Configure behavior</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-lg border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={onStop}
              disabled={!pad.isActive}
            >
              <Square size={14} fill="currentColor" />
            </Button>
            <div className="bg-secondary p-1.5 md:p-2 rounded-lg">
               <SlidersHorizontal size={16} className="text-primary" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 md:space-y-8 p-4 md:p-6">
        {/* Loop Toggle */}
        <div className="flex items-center justify-between bg-secondary/50 p-3 md:p-4 rounded-xl border border-border/50">
          <div className="space-y-0.5">
            <Label className="text-sm md:text-base font-semibold flex items-center gap-2">
              <Repeat size={14} /> Loop
            </Label>
            <span className="text-[10px] md:text-xs text-muted-foreground">Continuous play</span>
          </div>
          <Switch 
            checked={pad.loop} 
            onCheckedChange={(checked) => onUpdate({ loop: checked })} 
          />
        </div>

        {/* Pitch Slider */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-xs md:text-sm font-medium">Pitch / Speed</Label>
            <span className="text-[10px] md:text-xs font-mono bg-primary/20 text-primary px-2 py-0.5 rounded">
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
          <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-wider">
            <span>Half</span>
            <span>Normal</span>
            <span>Double</span>
          </div>
        </div>

        {/* Bass Slider */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-xs md:text-sm font-medium">Bass Boost</Label>
            <span className="text-[10px] md:text-xs font-mono bg-accent/20 text-accent px-2 py-0.5 rounded">
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
        </div>

        {/* Individual Volume Slider */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-xs md:text-sm font-medium">Pad Volume</Label>
            <span className="text-[10px] md:text-xs font-mono text-muted-foreground">
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
        <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Label className="text-xs md:text-sm font-medium flex items-center gap-2">
              <Palette size={14} /> Pad Color
            </Label>
          </div>
          <div className="flex gap-3 items-center">
            <Input 
              type="color" 
              value={pad.color} 
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-10 h-10 md:w-12 md:h-12 p-1 bg-transparent border-none cursor-pointer"
            />
            <div className="flex-1">
              <Input 
                type="text" 
                value={pad.color} 
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="font-mono uppercase h-8 md:h-10 text-xs md:text-sm"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
