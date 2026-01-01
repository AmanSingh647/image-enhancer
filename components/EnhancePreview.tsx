"use client";
import { Sparkles } from "lucide-react";

interface Props {
  isProcessing: boolean;
  imageUrl: string | null;
}

export default function EnhancedPreview({ isProcessing, imageUrl }: Props) {
  return (
    <div className="relative h-[450px] w-full bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
      {isProcessing ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500 blur-xl animate-pulse"></div>
            <div className="relative animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
          <p className="text-indigo-400 font-medium animate-pulse">
            AI is enhancing details...
          </p>
        </div>
      ) : imageUrl ? (
        <>
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-full bg-indigo-500 backdrop-blur-md text-[10px] uppercase tracking-widest font-bold text-white border border-indigo-400/50 flex items-center gap-1">
              <Sparkles size={10} /> AI Enhanced
            </span>
          </div>
          <img
            src={imageUrl}
            className="w-full h-full object-contain bg-slate-950"
            alt="Enhanced"
          />
        </>
      ) : (
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700">
            <Sparkles className="text-slate-600" size={32} />
          </div>
          <p className="text-slate-500 font-medium">
            Enhanced output will appear here
          </p>
        </div>
      )}
    </div>
  );
}
