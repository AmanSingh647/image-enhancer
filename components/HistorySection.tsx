"use client";

import {
  Clock,
  ExternalLink,
  Download,
  Loader2,
  Trash2,
  ImageOff,
} from "lucide-react";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

interface HistoryItem {
  id: string;
  enhancedUrl: string;
  createdAt: string;
  [key: string]: any;
}

export default function HistorySection({ items }: { items: HistoryItem[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Logic to Force Download the image
  const handleDownload = async (url: string, id: string) => {
    setDownloadingId(id);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `enhanced-${id}.png`; // Force a filename
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("History download failed", error);
      // Fallback: Just open it if the blob download fails
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  // Logic to Delete from Firestore
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this from your history?"))
      return;

    try {
      await deleteDoc(doc(db, "enhancements", id));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete. Check console.");
    }
  };

  return (
    <div className="mt-24 border-t border-slate-800 pt-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Clock className="text-indigo-500" size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">
          Your Enhancement History
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="text-slate-500 italic">
          No history yet. Enhance an image to see it here.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
            >
              {/* Image Container */}
              <div className="aspect-square w-full relative bg-slate-950">
                {imageErrors[item.id] ? (
                  // Fallback if image is deleted from Cloudinary
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2 p-4 text-center">
                    <ImageOff size={32} />
                    <span className="text-xs">Image not found</span>
                  </div>
                ) : (
                  // The Actual Image
                  <img
                    src={item.enhancedUrl}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt="Enhanced History"
                    onError={() =>
                      setImageErrors((prev) => ({ ...prev, [item.id]: true }))
                    }
                  />
                )}

                {/* Floating Overlay (Only visible on hover) */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  {/* 1. Open New Tab */}
                  {!imageErrors[item.id] && (
                    <a
                      href={item.enhancedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white/10 hover:bg-indigo-600 text-white rounded-full transition-all backdrop-blur-md border border-white/10 hover:scale-110"
                      title="Open in new tab"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}

                  {/* 2. Download Button */}
                  {!imageErrors[item.id] && (
                    <button
                      onClick={() => handleDownload(item.enhancedUrl, item.id)}
                      className="p-3 bg-white text-slate-950 hover:bg-indigo-50 rounded-full transition-all shadow-lg hover:scale-110"
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
                  )}

                  {/* 3. Delete Button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-red-500/20 hover:bg-red-600 text-red-200 hover:text-white rounded-full transition-all backdrop-blur-md border border-red-500/30 hover:scale-110"
                    title="Delete from History"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  4X UPSCALE
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
