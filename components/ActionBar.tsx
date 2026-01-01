"use client";

import { Sparkles, Download } from "lucide-react";

interface Props {
  onEnhance: () => void;
  disabled: boolean;
  enhancedUrl: string | null;
}

export default function ActionBar({ onEnhance, disabled, enhancedUrl }: Props) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      <button
        onClick={onEnhance}
        disabled={disabled}
        className="flex items-center gap-2 px-8 py-4 rounded-full bg-blue-600 text-white font-bold disabled:bg-slate-300"
      >
        Start AI Enhancement <Sparkles size={18} />
      </button>

      {enhancedUrl && (
        <a
          href={enhancedUrl}
          download
          className="flex items-center gap-2 text-blue-600"
        >
          <Download size={16} /> Download Result
        </a>
      )}
    </div>
  );
}
