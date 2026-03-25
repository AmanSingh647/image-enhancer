"use client";
import { useCallback, useRef, useState } from "react";
import { Columns2 } from "lucide-react";

interface Props {
  beforeUrl: string;
  afterUrl: string;
}

export default function CompareSlider({ beforeUrl, afterUrl }: Props) {
  const [position, setPosition] = useState(50); // percentage 0–100
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    updatePosition(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    updatePosition(e.clientX);
  };
  const onMouseUp = () => { dragging.current = false; };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    updatePosition(e.touches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    updatePosition(e.touches[0].clientX);
  };
  const onTouchEnd = () => { dragging.current = false; };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Original</span>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Columns2 size={14} />
          <span className="text-[11px] font-medium">Drag to compare</span>
        </div>
        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">AI Enhanced</span>
      </div>

      {/* Slider area */}
      <div
        ref={containerRef}
        className="relative h-[420px] w-full select-none cursor-col-resize bg-slate-950"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* After (enhanced) — base layer, full width */}
        <img
          src={afterUrl}
          alt="Enhanced"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Before (original) — clipped to left side */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={beforeUrl}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ width: containerRef.current?.clientWidth ?? "100%" }}
            draggable={false}
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        />

        {/* Drag handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center pointer-events-none"
          style={{ left: `${position}%` }}
        >
          <div className="flex items-center gap-0.5">
            <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
            <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
          </div>
        </div>

        {/* Position badge */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white font-medium pointer-events-none">
          {Math.round(position)}% original
        </div>
      </div>
    </div>
  );
}
