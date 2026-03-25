"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, ZoomIn } from "lucide-react";

interface Props {
  isProcessing: boolean;
  imageUrl: string | null;
  processingTime?: number | null;
  outputDimensions?: { width: number; height: number } | null;
  filterStyle?: string;
  onZoom?: () => void;
}

export default function EnhancedPreview({
  isProcessing,
  imageUrl,
  processingTime,
  outputDimensions,
  filterStyle,
  onZoom,
}: Props) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isProcessing) {
      setElapsed(0);
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isProcessing]);

  return (
    <div className="relative h-[450px] w-full bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
      {isProcessing ? (
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500 blur-xl animate-pulse opacity-60" />
            <div className="relative animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
          <p className="text-indigo-400 font-medium animate-pulse">AI is enhancing details...</p>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-white tabular-nums">{elapsed}s</span>
            <span className="text-xs text-slate-500">elapsed — large images take 15–60s</span>
          </div>
          <div className="flex flex-col gap-1.5 mt-2 w-full max-w-[200px]">
            {["Decoding image", "Tiling & upscaling", "Uploading result"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${elapsed > i * 4 ? "bg-indigo-400" : "bg-slate-700"}`} />
                <span className={`text-xs transition-colors duration-500 ${elapsed > i * 4 ? "text-slate-300" : "text-slate-600"}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      ) : imageUrl ? (
        <>
          {/* Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
            <span className="px-3 py-1 rounded-full bg-indigo-500 backdrop-blur-md text-[10px] uppercase tracking-widest font-bold text-white border border-indigo-400/50 flex items-center gap-1">
              <Sparkles size={10} /> AI Enhanced
            </span>
            {outputDimensions && (
              <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] text-slate-300 border border-white/10">
                {outputDimensions.width} × {outputDimensions.height}px
              </span>
            )}
            {processingTime && (
              <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] text-slate-300 border border-white/10">
                Done in {processingTime}s
              </span>
            )}
          </div>

          {/* Zoom button */}
          {onZoom && (
            <button
              onClick={onZoom}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-indigo-600 backdrop-blur-md text-white rounded-xl border border-white/10 transition-all hover:scale-105"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
          )}

          <img
            src={imageUrl}
            className="w-full h-full object-contain bg-slate-950 cursor-zoom-in"
            style={{ filter: filterStyle }}
            alt="Enhanced"
            onClick={onZoom}
          />
        </>
      ) : (
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700">
            <Sparkles className="text-slate-600" size={32} />
          </div>
          <p className="text-slate-500 font-medium">Enhanced output will appear here</p>
          <p className="text-slate-600 text-sm mt-1">Select a scale and click Generate</p>
        </div>
      )}
    </div>
  );
}
