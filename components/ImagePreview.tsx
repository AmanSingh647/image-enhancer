"use client";

import { RefreshCw } from "lucide-react";

interface Props {
  url: string;
  onReset: () => void;
}

export default function ImagePreview({ url, onReset }: Props) {
  return (
    <div className="relative h-80 bg-white rounded-2xl border overflow-hidden">
      <img src={url} className="w-full h-full object-contain" />
      <button
        onClick={onReset}
        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
}
