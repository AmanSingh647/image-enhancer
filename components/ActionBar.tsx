"use client";
import { Sparkles, Download, Loader2, Share2, Check, ChevronDown, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

type DownloadFormat = "webp" | "png" | "jpg";

interface Props {
  onEnhance: () => void;
  disabled: boolean;
  enhancedUrl: string | null;
  scale: number;
  onScaleChange: (scale: number) => void;
  onCompareToggle?: () => void;
  showCompare?: boolean;
  compareActive?: boolean;
  filterStyle?: string;
}

const FORMAT_MIME: Record<DownloadFormat, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
};

export default function ActionBar({
  onEnhance, disabled, enhancedUrl, scale, onScaleChange,
  onCompareToggle, showCompare, compareActive, filterStyle,
}: Props) {
  const [isDownloading, setIsDownloading]   = useState(false);
  const [linkCopied, setLinkCopied]         = useState(false);
  const [imageCopied, setImageCopied]       = useState(false);
  const [format, setFormat]                 = useState<DownloadFormat>("webp");
  const [formatOpen, setFormatOpen]         = useState(false);
  const dropdownRef                         = useRef<HTMLDivElement>(null);

  const buildCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!enhancedUrl) return null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = enhancedUrl; });
    const canvas = document.createElement("canvas");
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    if (filterStyle && filterStyle !== "brightness(1) contrast(1) saturate(1)") {
      ctx.filter = filterStyle;
    }
    ctx.drawImage(img, 0, 0);
    return canvas;
  };

  const handleDownload = async () => {
    if (!enhancedUrl) return;
    setIsDownloading(true);
    setFormatOpen(false);
    try {
      const canvas = await buildCanvas();
      if (!canvas) { window.open(enhancedUrl, "_blank"); return; }
      canvas.toBlob((blob) => {
        if (!blob) { window.open(enhancedUrl, "_blank"); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `enhanced-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, FORMAT_MIME[format], 0.95);
    } catch { window.open(enhancedUrl, "_blank"); }
    finally { setIsDownloading(false); }
  };

  const handleCopyImage = async () => {
    if (!enhancedUrl) return;
    try {
      const canvas = await buildCanvas();
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2500);
      }, "image/png");
    } catch { /* clipboard not supported — silently ignore */ }
  };

  const handleShareLink = async () => {
    if (!enhancedUrl) return;
    try {
      await navigator.clipboard.writeText(enhancedUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch { window.open(enhancedUrl, "_blank"); }
  };

  return (
    <div className="mt-10 flex flex-col items-center gap-5">
      {/* Scale selector */}
      {!enhancedUrl && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">Upscale factor:</span>
          <div className="flex rounded-xl overflow-hidden border border-slate-700">
            {[2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onScaleChange(s)}
                className={`px-5 py-2 text-sm font-bold transition-all
                  ${scale === s ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}

      {!enhancedUrl ? (
        <button
          onClick={onEnhance}
          disabled={disabled}
          className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl bg-indigo-600 text-white font-bold text-lg transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] active:scale-95"
        >
          Generate High-Res
          <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-3 flex-wrap justify-center">

            {/* Download + format picker */}
            <div className="relative flex" ref={dropdownRef}>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 pl-6 pr-4 py-3.5 rounded-l-2xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition-all shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-wait"
              >
                {isDownloading
                  ? <><Loader2 size={18} className="animate-spin" /> Downloading...</>
                  : <><Download size={18} /> Download .{format.toUpperCase()}</>}
              </button>
              <button
                onClick={() => setFormatOpen((o) => !o)}
                className="flex items-center px-3 py-3.5 rounded-r-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition border-l border-slate-300 shadow-xl"
                title="Choose format"
              >
                <ChevronDown size={16} className={`transition-transform ${formatOpen ? "rotate-180" : ""}`} />
              </button>
              {formatOpen && (
                <div className="absolute top-full mt-1 right-0 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-20 min-w-[120px]">
                  {(["webp", "png", "jpg"] as DownloadFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFormat(f); setFormatOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center justify-between transition
                        ${format === f ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300 hover:bg-slate-800"}`}
                    >
                      .{f.toUpperCase()}
                      {format === f && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy image to clipboard */}
            <button
              onClick={handleCopyImage}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-all border border-slate-700 shadow-lg active:scale-95"
              title="Copy image to clipboard"
            >
              {imageCopied
                ? <><Check size={18} className="text-emerald-400" /> Copied!</>
                : <><ImageIcon size={18} /> Copy Image</>}
            </button>

            {/* Share link */}
            <button
              onClick={handleShareLink}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-all border border-slate-700 shadow-lg active:scale-95"
            >
              {linkCopied
                ? <><Check size={18} className="text-emerald-400" /> Copied!</>
                : <><Share2 size={18} /> Share Link</>}
            </button>

            {/* Compare toggle */}
            {showCompare && onCompareToggle && (
              <button
                onClick={onCompareToggle}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-semibold transition-all border shadow-lg active:scale-95
                  ${compareActive
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"}`}
              >
                {compareActive ? "Hide Compare" : "Compare View"}
              </button>
            )}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="text-slate-500 hover:text-white text-sm font-medium transition"
          >
            Enhance another image
          </button>
        </div>
      )}
    </div>
  );
}
