"use client";
import { ArrowRight, Clock, Maximize2, FileImage } from "lucide-react";

interface Props {
  originalFileSize: number;
  originalDimensions: { width: number; height: number };
  outputDimensions: { width: number; height: number };
  processingTime: number;
  scale: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageStats({ originalFileSize, originalDimensions, outputDimensions, processingTime, scale }: Props) {
  return (
    <div className="w-full grid grid-cols-3 gap-3 mt-4">
      {/* Dimensions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Maximize2 size={13} />
          <span className="text-[11px] uppercase tracking-widest font-bold">Resolution</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 flex-wrap">
          <span className="text-slate-500">{originalDimensions.width}×{originalDimensions.height}</span>
          <ArrowRight size={14} className="text-indigo-400 shrink-0" />
          <span className="text-white">{outputDimensions.width}×{outputDimensions.height}</span>
        </div>
        <span className="text-[10px] text-indigo-400 font-bold">{scale}x upscale</span>
      </div>

      {/* File size */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <FileImage size={13} />
          <span className="text-[11px] uppercase tracking-widest font-bold">Input Size</span>
        </div>
        <span className="text-sm font-semibold text-white">{formatBytes(originalFileSize)}</span>
        <span className="text-[10px] text-slate-500">original upload</span>
      </div>

      {/* Processing time */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock size={13} />
          <span className="text-[11px] uppercase tracking-widest font-bold">Time</span>
        </div>
        <span className="text-sm font-semibold text-white">{processingTime}s</span>
        <span className="text-[10px] text-slate-500">processing time</span>
      </div>
    </div>
  );
}
