"use client";

import { Upload } from "lucide-react";

interface Props {
  onFileSelect: (file: File) => void;
}

export default function ImageUploader({ onFileSelect }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Only JPG or PNG allowed");
      return;
    }

    onFileSelect(file);
  };

  return (
    <label className="border-2 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center cursor-pointer bg-white hover:border-blue-400">
      <input type="file" hidden onChange={handleChange} />
      <Upload className="w-8 h-8 text-blue-600 mb-3" />
      <p className="font-medium">Click or drag image</p>
      <p className="text-sm text-slate-400">PNG or JPG</p>
    </label>
  );
}
