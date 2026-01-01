"use client";
import { Clock, ExternalLink, Download, Loader2 } from "lucide-react";
import { useState } from "react";

export default function HistorySection({ items }: { items: any[] }) {
  // We use a local state to track which ID is currently downloading to show a spinner
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (url: string, id: string) => {
    setDownloadingId(id);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `enhanced-${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("History download failed", error);
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mt-24 border-t border-slate-800 pt-12">
      <div className="flex items-center gap-2 mb-8">
        <Clock className="text-indigo-500" />
        <h2 className="text-2xl font-bold text-white">
          Your Enhancement History
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition-all"
          >
            {/* Image Container */}
            <div className="aspect-square w-full relative">
              <img
                src={item.enhancedUrl}
                className="w-full h-full object-cover"
                alt="Enhanced History"
              />

              {/* Floating Overlay on Hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                {/* 1. Open in New Tab Button */}
                <a
                  href={item.enhancedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-700/50 hover:bg-indigo-600 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
                  title="Open in new tab"
                >
                  <ExternalLink size={18} />
                </a>

                {/* 2. Download Button */}
                <button
                  onClick={() => handleDownload(item.enhancedUrl, item.id)}
                  className="p-3 bg-white hover:bg-indigo-50 text-slate-950 rounded-full transition-all shadow-lg"
                  title="Download Image"
                  disabled={downloadingId === item.id}
                >
                  {downloadingId === item.id ? (
                    <Loader2
                      size={18}
                      className="animate-spin text-indigo-600"
                    />
                  ) : (
                    <Download size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-3 text-[10px] text-slate-500 flex justify-between uppercase tracking-tighter bg-slate-950/50">
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <span className="text-indigo-400 font-bold">4X UPSCALE</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
