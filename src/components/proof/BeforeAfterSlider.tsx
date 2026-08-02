"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Existing Surface Condition",
  afterLabel = "Finished Sky's Protection",
  className = "",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 select-none ${className}`}>
      {/* Container aspect ratio */}
      <div className="relative aspect-[16/10] w-full">
        {/* After Image (Background) */}
        <Image
          src={afterImage}
          alt={afterLabel}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
          priority
        />
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-slate-950/80 text-amber-400 border-amber-500/30 backdrop-blur-md px-3 py-1 font-mono text-xs">
            <Sparkles className="size-3 mr-1 inline" />
            {afterLabel}
          </Badge>
        </div>

        {/* Before Image (Clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <Image
            src={beforeImage}
            alt={beforeLabel}
            fill
            className="object-cover object-left"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="outline" className="bg-slate-950/80 text-slate-300 border-slate-700 backdrop-blur-md px-3 py-1 font-mono text-xs">
              {beforeLabel}
            </Badge>
          </div>
        </div>

        {/* Vertical Divider Line */}
        <div
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-8 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg border-2 border-slate-950 cursor-grab active:cursor-grabbing">
            <Sliders className="size-4 rotate-90" />
          </div>
        </div>

        {/* Hidden Range Input for Accessibility & Touch */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute inset-0 z-30 opacity-0 cursor-ew-resize w-full h-full"
          aria-label="Before and after transformation slider"
        />
      </div>

      <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>← Slide to inspect prep &amp; finish transformation →</span>
        <span className="text-amber-400 font-semibold">{sliderPosition}% Finished</span>
      </div>
    </div>
  );
}
