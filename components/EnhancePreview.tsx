"use client";

interface Props {
  isProcessing: boolean;
  imageUrl: string | null;
}

export default function EnhancedPreview({ isProcessing, imageUrl }: Props) {
  return (
    <div className="h-80 rounded-2xl border bg-slate-100 flex items-center justify-center">
      {isProcessing ? (
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      ) : imageUrl ? (
        <img src={imageUrl} className="w-full h-full object-contain bg-white" />
      ) : (
        <p className="text-slate-400">Enhanced image will appear here</p>
      )}
    </div>
  );
}
