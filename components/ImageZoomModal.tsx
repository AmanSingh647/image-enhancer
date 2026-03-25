"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Props {
  imageUrl: string;
  filterStyle?: string;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

export default function ImageZoomModal({ imageUrl, filterStyle, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const reset = useCallback(() => { setZoom(1); setPos({ x: 0, y: 0 }); }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Scroll to zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * 0.005)));
  }, []);

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onMouseUp = () => { dragging.current = false; };

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1) return;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const zoomIn  = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(1)));
  const zoomOut = () => { setZoom((z) => { const nz = Math.max(MIN_ZOOM, +(z - 0.5).toFixed(1)); if (nz === 1) setPos({ x: 0, y: 0 }); return nz; }); };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Image area — stop propagation so clicking image doesn't close */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
        style={{ cursor: zoom > 1 ? "grab" : "zoom-in" }}
      >
        <img
          src={imageUrl}
          alt="Zoomed"
          draggable={false}
          className="max-w-none select-none pointer-events-none transition-transform duration-100"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
            filter: filterStyle,
            maxHeight: "90vh",
            maxWidth: "90vw",
          }}
          onDoubleClick={reset}
        />
      </div>

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl px-2 py-1">
          <button onClick={zoomOut} className="p-1.5 hover:text-indigo-400 transition text-slate-300" title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-slate-300 tabular-nums w-10 text-center font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={zoomIn} className="p-1.5 hover:text-indigo-400 transition text-slate-300" title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button onClick={reset} className="p-1.5 hover:text-indigo-400 transition text-slate-400 border-l border-slate-700 ml-1 pl-2" title="Reset zoom">
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-red-600/80 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-600 pointer-events-none">
        Scroll to zoom · Drag to pan · Double-click to reset · Esc to close
      </div>
    </div>
  );
}
