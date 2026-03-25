"use client";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const SLIDERS = [
  { key: "brightness" as const, label: "Brightness", min: 0.5, max: 2,   step: 0.05, default: 1 },
  { key: "contrast"   as const, label: "Contrast",   min: 0.5, max: 2,   step: 0.05, default: 1 },
  { key: "saturation" as const, label: "Saturation", min: 0,   max: 2,   step: 0.05, default: 1 },
];

const DEFAULT_FILTERS: Filters = { brightness: 1, contrast: 1, saturation: 1 };

function isDefault(f: Filters) {
  return f.brightness === 1 && f.contrast === 1 && f.saturation === 1;
}

export default function PostProcessing({ filters, onChange }: Props) {
  const set = (key: keyof Filters, value: number) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-300">
          <SlidersHorizontal size={16} className="text-indigo-400" />
          <span className="text-sm font-semibold">Adjustments</span>
          <span className="text-[10px] text-slate-600 ml-1">preview only</span>
        </div>
        {!isDefault(filters) && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {SLIDERS.map(({ key, label, min, max, step }) => {
          const pct = ((filters[key] - min) / (max - min)) * 100;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
              <div className="relative flex-1 h-1.5 bg-slate-700 rounded-full">
                <div
                  className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full pointer-events-none"
                  style={{ width: `${pct}%` }}
                />
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={filters[key]}
                  onChange={(e) => set(key, parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right tabular-nums">
                {filters[key].toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
