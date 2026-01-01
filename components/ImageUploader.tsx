"use client";
import { Upload, Image as ImageIcon } from "lucide-react";

interface Props {
  onFileSelect: (file: File) => void;
}

export default function ImageUploader({ onFileSelect }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPG, PNG or WebP allowed");
      return;
    }
    onFileSelect(file);
  };

  return (
    <label className="flex flex-col items-center justify-center h-[450px] w-full border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50 hover:bg-slate-800/50 hover:border-indigo-500/50 transition-all cursor-pointer group">
      <input type="file" hidden onChange={handleChange} />
      <div className="p-4 rounded-2xl bg-slate-800 group-hover:bg-indigo-500/10 group-hover:scale-110 transition-all duration-300 mb-4">
        <Upload className="w-8 h-8 text-indigo-400" />
      </div>
      <p className="text-lg font-semibold text-white">Drop your image here</p>
      <p className="text-sm text-slate-500 mt-1">
        Supports PNG, JPG (Max 10MB)
      </p>
    </label>
  );
}
