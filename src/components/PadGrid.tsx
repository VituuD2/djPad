"use client";

import React from 'react';
import { PadState } from '@/types/dj-pad';
import { cn } from '@/lib/utils';
import { Repeat } from 'lucide-react';

interface PadGridProps {
  pads: PadState[];
  selectedPadId: number | null;
  onPadPress: (id: number) => void;
  onPadStop: (id: number) => void;
  onPadSelect: (id: number) => void;
}

export const PadGrid: React.FC<PadGridProps> = ({ 
  pads, 
  selectedPadId, 
  onPadPress, 
  onPadStop, 
  onPadSelect 
}) => {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl aspect-square">
      {pads.map((pad) => (
        <button
          key={pad.id}
          onMouseDown={() => {
            onPadSelect(pad.id);
            onPadPress(pad.id);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            onPadSelect(pad.id);
            onPadPress(pad.id);
          }}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg sm:rounded-xl transition-all duration-75 select-none touch-none",
            "border-b-2 sm:border-b-4 active:translate-y-[2px] active:border-b-0",
            pad.isActive ? "pad-active scale-[0.98]" : "hover:brightness-110",
            selectedPadId === pad.id ? "ring-2 ring-accent ring-offset-2 ring-offset-background z-10" : "shadow-md sm:shadow-lg"
          )}
          style={{ 
            backgroundColor: pad.color,
            borderColor: `color-mix(in srgb, ${pad.color}, black 30%)`,
            color: 'white',
          }}
        >
          <span className="text-[10px] sm:text-xs md:text-sm font-bold opacity-80 pointer-events-none truncate px-1 max-w-full">
            {pad.label}
          </span>
          
          {pad.loop && (
            <div className={cn(
              "absolute top-1 right-1 sm:top-2 sm:right-2 transition-opacity pointer-events-none",
              pad.isActive ? "opacity-100" : "opacity-40"
            )}>
              <Repeat size={10} className={cn("sm:w-3 sm:h-3", pad.isActive ? "loop-indicator" : "")} />
            </div>
          )}

          {pad.isActive && (
            <div className="absolute inset-0 bg-white/20 rounded-lg sm:rounded-xl animate-pulse pointer-events-none" />
          )}
        </button>
      ))}
    </div>
  );
};
