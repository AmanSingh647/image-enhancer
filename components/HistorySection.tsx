"use client";

import {
  Clock,
  ExternalLink,
  Download,
  Loader2,
  Trash2,
  ImageOff,
  Columns2,
  X,
} from "lucide-react";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { HistoryItem } from "@/hooks/useAuth";
import CompareSlider from "@/components/CompareSlider";
import { ToastMessage } from "@/components/Toast";

interface Props {
  items: HistoryItem[];
  onToast: (type: ToastMessage["type"], message: string) => void;
}

export default function HistorySection({ items, onToast }: Props) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [compareItem, setCompareItem] = useState<HistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      onToast("success", "Image downloaded successfully.");
    } catch {
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "enhancements", id));
      onToast("info", "Removed from history.");
    } catch (error) {
      console.error("Error deleting document:", error);
      onToast("error", "Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="mt-24 border-t border-slate-800 pt-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Clock className="text-indigo-500" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Your Enhancement History</h2>
          </div>

          {/* Stats banner */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
              <span className="text-white font-bold">{items.length}</span> image{items.length !== 1 ? "s" : ""} enhanced
            </span>
            {items.length > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
                Since{" "}
                <span className="text-white font-bold">
                  {new Date(items[items.length - 1].createdAt).toLocaleDateString()}
                </span>
              </span>
            )}
            {items.length > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
                Latest{" "}
                <span className="text-white font-bold">
                  {new Date(items[0].createdAt).toLocaleDateString()}
                </span>
              </span>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-slate-500 italic">No history yet. Enhance an image to see it here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
              >
                {/* Image area */}
                <div className="aspect-square w-full relative bg-slate-950 overflow-hidden">
                  {imageErrors[item.id] ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2 p-4 text-center">
                      <ImageOff size={32} />
                      <span className="text-xs">Image not found</span>
                    </div>
                  ) : (
                    <img
                      src={item.enhancedUrl}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt="Enhanced"
                      onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
                    />
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    {!imageErrors[item.id] && (
                      <>
                        {/* Compare */}
                        {item.originalUrl && (
                          <button
                            onClick={() => setCompareItem(item)}
                            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-lg hover:scale-110"
                            title="Before / After Compare"
                          >
                            <Columns2 size={18} />
                          </button>
                        )}

                        {/* Open in new tab */}
                        <a
                          href={item.enhancedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10 hover:scale-110"
                          title="Open in new tab"
                        >
                          <ExternalLink size={18} />
                        </a>

                        {/* Download */}
                        <button
                          onClick={() => handleDownload(item.enhancedUrl, item.id)}
                          className="p-3 bg-white text-slate-950 hover:bg-indigo-50 rounded-full transition-all shadow-lg hover:scale-110"
                          title="Download"
                          disabled={downloadingId === item.id}
                        >
                          {downloadingId === item.id ? (
                            <Loader2 size={18} className="animate-spin text-indigo-600" />
                          ) : (
                            <Download size={18} />
                          )}
                        </button>
                      </>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-3 bg-red-500/20 hover:bg-red-600 text-red-200 hover:text-white rounded-full transition-all backdrop-blur-md border border-red-500/30 hover:scale-110 disabled:opacity-60 disabled:cursor-wait"
                      title="Delete"
                    >
                      {deletingId === item.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    AI ENHANCED
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compare Modal */}
      {compareItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setCompareItem(null)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setCompareItem(null)}
              className="absolute -top-4 -right-4 z-10 p-2 bg-slate-800 hover:bg-red-600 text-white rounded-full border border-slate-700 transition-all shadow-xl"
            >
              <X size={18} />
            </button>

            <CompareSlider
              beforeUrl={compareItem.originalUrl}
              afterUrl={compareItem.enhancedUrl}
            />

            <p className="text-center text-slate-500 text-xs mt-3">
              Enhanced on {new Date(compareItem.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
