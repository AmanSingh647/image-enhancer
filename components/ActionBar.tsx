"use client";
import { Sparkles, Download, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  onEnhance: () => void;
  disabled: boolean;
  enhancedUrl: string | null;
}

export default function ActionBar({ onEnhance, disabled, enhancedUrl }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!enhancedUrl) return;
    setIsDownloading(true);
    try {
      // 1. Fetch the image as a blob
      const response = await fetch(enhancedUrl);
      const blob = await response.blob();

      // 2. Create a temporary link to trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `enhanced-${Date.now()}.png`; // Unique filename
      document.body.appendChild(link);
      link.click();

      // 3. Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: Open in new tab if blob fails
      window.open(enhancedUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      {!enhancedUrl ? (
        <button
          onClick={onEnhance}
          disabled={disabled}
          className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl bg-indigo-600 text-white font-bold text-lg transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] active:scale-95"
        >
          Generate High-Res{" "}
          <Sparkles
            size={20}
            className="group-hover:rotate-12 transition-transform"
          />
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-100 transition-all shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-wait"
          >
            {isDownloading ? (
              <>
                Downloading... <Loader2 size={20} className="animate-spin" />
              </>
            ) : (
              <>
                Download Result <Download size={20} />
              </>
            )}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="text-slate-400 hover:text-white text-sm font-medium transition"
          >
            Enhance another image
          </button>
        </div>
      )}
    </div>
  );
}
