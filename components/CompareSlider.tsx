"use client";
import { useCallback, useRef, useState } from "react";

interface Props {
  beforeUrl: string;
  afterUrl: string;
}

export default function CompareSlider({ beforeUrl, afterUrl }: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onMouseDown  = (e: React.MouseEvent)  => { dragging.current = true;  updatePosition(e.clientX); };
  const onMouseMove  = (e: React.MouseEvent)  => { if (dragging.current) updatePosition(e.clientX); };
  const onMouseUp    = ()                      => { dragging.current = false; };
  const onTouchStart = (e: React.TouchEvent)  => { dragging.current = true;  updatePosition(e.touches[0].clientX); };
  const onTouchMove  = (e: React.TouchEvent)  => { if (dragging.current) updatePosition(e.touches[0].clientX); };
  const onTouchEnd   = ()                      => { dragging.current = false; };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] rounded-2xl overflow-hidden select-none cursor-col-resize bg-slate-950 shadow-2xl border border-slate-800"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── AFTER image (enhanced) — full, base layer ── */}
      <img
        src={afterUrl}
        alt="AI Enhanced"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* ── BEFORE image (original) — clipped to left of slider ── */}
      <img
        src={beforeUrl}
        alt="Original"
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      {/* ── Divider line ── */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none"
        style={{
          left: `${position}%`,
          transform: "translateX(-50%)",
          boxShadow: "0 0 10px rgba(255,255,255,0.6), 0 0 2px rgba(255,255,255,1)",
        }}
      />

      {/* ── Drag handle ── */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
        style={{ left: `${position}%` }}
      >
        {/* Outer ring */}
        <div className="w-11 h-11 rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center">
          {/* Left arrow */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 5L3 10L8 15" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 5L17 10L12 15" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── BEFORE label (top-left, fixed) ── */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <span className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-widest border border-white/10">
          Before
        </span>
      </div>

      {/* ── AFTER label (top-right, fixed) ── */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <span className="px-3 py-1.5 rounded-lg bg-indigo-600/80 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-widest border border-indigo-400/30">
          After
        </span>
      </div>

      {/* ── Drag hint (fades out once user has dragged) ── */}
      {position === 50 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none animate-pulse">
          <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] text-slate-300 border border-white/10">
            Drag to compare
          </span>
        </div>
      )}
    </div>
  );
}
