"use client";
import { useState, useCallback } from "react";
import { Upload } from "lucide-react";

interface Props {
  onFileSelect: (file: File) => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

function validateFile(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return "Only JPG, PNG, or WebP files are allowed.";
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File is too large. Max size is ${MAX_SIZE_MB}MB.`;
  return null;
}

export default function ImageUploader({ onFileSelect }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError(null);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center h-[450px] w-full border-2 border-dashed rounded-2xl bg-slate-900/50 transition-all cursor-pointer group
          ${isDragging
            ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
            : "border-slate-700 hover:bg-slate-800/50 hover:border-indigo-500/50"
          }`}
      >
        <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={handleInputChange} />
        <div
          className={`p-4 rounded-2xl transition-all duration-300 mb-4
            ${isDragging
              ? "bg-indigo-500/20 scale-110"
              : "bg-slate-800 group-hover:bg-indigo-500/10 group-hover:scale-110"
            }`}
        >
          <Upload className={`w-8 h-8 transition-colors ${isDragging ? "text-indigo-300" : "text-indigo-400"}`} />
        </div>

        {isDragging ? (
          <p className="text-lg font-semibold text-indigo-300">Release to upload</p>
        ) : (
          <>
            <p className="text-lg font-semibold text-white">Drop your image here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse</p>
          </>
        )}
        <p className="text-xs text-slate-600 mt-3">PNG, JPG, WebP — max {MAX_SIZE_MB}MB</p>
      </label>

      {error && (
        <p className="text-sm text-red-400 text-center px-2">{error}</p>
      )}
    </div>
  );
}
