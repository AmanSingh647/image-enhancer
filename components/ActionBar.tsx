"use client";

import { useState } from "react";
import { Sparkles, Download, ArrowRight, Loader2 } from "lucide-react";

interface Props {
  onEnhance: () => void;
  disabled: boolean;
  enhancedUrl: string | null;
}

export default function ActionBar({ onEnhance, disabled, enhancedUrl }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  // This is the new download logic
  const handleDownload = async () => {
    if (!enhancedUrl) return;

    setIsDownloading(true);
    try {
      // 1. Fetch the image data from the Cloudinary URL
      const response = await fetch(enhancedUrl);
      const blob = await response.blob(); // 2. Convert the response to a Blob

      // 3. Create a temporary local URL for the Blob
      const blobUrl = URL.createObjectURL(blob);

      // 4. Create a hidden anchor element to trigger the download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "enhanced-image.png"; // Set the desired filename here
      document.body.appendChild(link);
      link.click(); // 5. Programmatically click the link

      // 6. Clean up by removing the link and revoking the Blob URL
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed", error);
      alert("Could not download the image.");
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
          {/* We changed the 'a' tag to a 'button' and use the onClick handler */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-100 transition-all shadow-xl active:scale-95 disabled:opacity-70"
          >
            {isDownloading ? (
              <>
                Downloading...
                <Loader2 size={20} className="animate-spin" />
              </>
            ) : (
              <>
                Download Result
                <Download size={20} />
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
