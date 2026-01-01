"use client";
import { Clock, ExternalLink } from "lucide-react";

export default function HistorySection({ items }: { items: any[] }) {
  return (
    <div className="mt-24 border-t border-slate-800 pt-12">
      <div className="flex items-center gap-2 mb-8">
        <Clock className="text-indigo-500" />
        <h2 className="text-2xl font-bold text-white">Your Enhancement History</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.id} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition-all">
            <div className="aspect-square w-full relative">
              <img src={item.enhancedUrl} className="w-full h-full object-cover" alt="Enhanced" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <a href={item.enhancedUrl} target="_blank" className="p-2 bg-indigo-600 rounded-full text-white">
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
            <div className="p-3 text-[10px] text-slate-500 flex justify-between uppercase tracking-tighter">
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <span className="text-indigo-400 font-bold">4X UPSCALE</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}