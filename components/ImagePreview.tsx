"use client";
import { X } from "lucide-react";

interface Props {
  url: string;
  onReset: () => void;
}

export default function ImagePreview({ url, onReset }: Props) {
  return (
    <div className="relative h-[450px] w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="absolute top-4 left-4 z-10">
        <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] uppercase tracking-widest font-bold text-slate-300 border border-white/10">
          Original Input
        </span>
      </div>
      <img src={url} className="w-full h-full object-contain" alt="Preview" />
      <button
        onClick={onReset}
        className="absolute top-4 right-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-xl transition-all border border-red-500/20"
      >
        <X size={20} />
      </button>
    </div>
  );
}
