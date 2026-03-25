"use client";
import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import ImagePreview from "@/components/ImagePreview";
import EnhancedPreview from "@/components/EnhancePreview";
import ActionBar from "@/components/ActionBar";
import HistorySection from "@/components/HistorySection";
import CompareSlider from "@/components/CompareSlider";
import PostProcessing from "@/components/PostProcessing";
import ImageStats from "@/components/ImageStats";
import ImageZoomModal from "@/components/ImageZoomModal";
import ToastContainer, { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/hooks/useAuth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

interface EnhanceResult {
  enhanced_url: string;
  processing_time_seconds: number;
  original_dimensions: { width: number; height: number };
  output_dimensions: { width: number; height: number };
  scale: number;
}

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
}

const DEFAULT_FILTERS: Filters = { brightness: 1, contrast: 1, saturation: 1 };

export default function Page() {
  const { user, addHistory, history } = useAuth();

  const [file, setFile]                           = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]               = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl]             = useState<string | null>(null);
  const [isProcessing, setIsProcessing]           = useState(false);
  const [scale, setScale]                         = useState<number>(4);
  const [compareActive, setCompareActive]         = useState(false);
  const [zoomOpen, setZoomOpen]                   = useState(false);
  const [processingTime, setProcessingTime]       = useState<number | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [outputDimensions, setOutputDimensions]   = useState<{ width: number; height: number } | null>(null);
  const [originalFileSize, setOriginalFileSize]   = useState<number | null>(null);
  const [filters, setFilters]                     = useState<Filters>(DEFAULT_FILTERS);
  const [toasts, setToasts]                       = useState<ToastMessage[]>([]);

  const filterStyle = `brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturation})`;

  const addToast = useCallback((type: ToastMessage["type"], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setEnhancedUrl(null);
    setCompareActive(false);
    setZoomOpen(false);
    setProcessingTime(null);
    setOriginalDimensions(null);
    setOutputDimensions(null);
    setOriginalFileSize(null);
    setFilters(DEFAULT_FILTERS);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Enter → enhance (when image ready, not already processing, no modal open)
      if (e.key === "Enter" && previewUrl && !isProcessing && !enhancedUrl && !zoomOpen) {
        e.preventDefault();
        enhanceImage();
      }
      // Escape → close zoom modal, or reset if no image processing
      if (e.key === "Escape") {
        if (zoomOpen) { setZoomOpen(false); return; }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl, isProcessing, enhancedUrl, zoomOpen]);

  const enhanceImage = async () => {
    if (!file) return;
    setIsProcessing(true);
    setEnhancedUrl(null);
    setCompareActive(false);
    setFilters(DEFAULT_FILTERS);

    try {
      const originalCloudUrl = await uploadImageToCloudinary(file);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("scale", String(scale));

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";
      const res = await fetch(`${backendUrl}/enhance`, { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        addToast("error", res.status === 429
          ? "Rate limit reached. Please wait a moment before trying again."
          : `Enhancement failed: ${err.detail || res.statusText}`);
        return;
      }

      const data: EnhanceResult = await res.json();
      setEnhancedUrl(data.enhanced_url);
      setProcessingTime(data.processing_time_seconds);
      setOriginalDimensions(data.original_dimensions);
      setOutputDimensions(data.output_dimensions);

      addToast("success", `Done in ${data.processing_time_seconds}s — ${data.scale}x upscale complete!`);

      if (user) await addHistory(originalCloudUrl, data.enhanced_url);
    } catch (e) {
      console.error(e);
      addToast("error", "Could not reach the Python backend. Is it running on port 8000?");
    } finally {
      setIsProcessing(false);
    }
  };

  const showStats = !!(enhancedUrl && originalFileSize && originalDimensions && outputDimensions && processingTime);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">

        {/* Compare view */}
        {compareActive && previewUrl && enhancedUrl ? (
          <section className="mb-10">
            <CompareSlider beforeUrl={previewUrl} afterUrl={enhancedUrl} />
          </section>
        ) : (
          <section className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-indigo-400">Step 1: Upload Source</h2>
              {previewUrl ? (
                <ImagePreview url={previewUrl} onReset={handleReset} />
              ) : (
                <ImageUploader
                  onFileSelect={(f) => {
                    setFile(f);
                    setPreviewUrl(URL.createObjectURL(f));
                    setOriginalFileSize(f.size);
                  }}
                />
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-cyan-400">Step 2: AI Result</h2>
              <EnhancedPreview
                isProcessing={isProcessing}
                imageUrl={enhancedUrl}
                processingTime={processingTime}
                outputDimensions={outputDimensions}
                filterStyle={filterStyle}
                onZoom={enhancedUrl ? () => setZoomOpen(true) : undefined}
              />
              {/* Post-processing sliders — only after enhancement */}
              {enhancedUrl && (
                <PostProcessing filters={filters} onChange={setFilters} />
              )}
            </div>
          </section>
        )}

        {/* Stats panel */}
        {showStats && !compareActive && (
          <ImageStats
            originalFileSize={originalFileSize!}
            originalDimensions={originalDimensions!}
            outputDimensions={outputDimensions!}
            processingTime={processingTime!}
            scale={scale}
          />
        )}

        <ActionBar
          onEnhance={enhanceImage}
          disabled={!previewUrl || isProcessing}
          enhancedUrl={enhancedUrl}
          scale={scale}
          onScaleChange={setScale}
          showCompare={!!(previewUrl && enhancedUrl)}
          compareActive={compareActive}
          onCompareToggle={() => setCompareActive((v) => !v)}
          filterStyle={filterStyle}
        />

        {/* Keyboard hint */}
        {previewUrl && !enhancedUrl && !isProcessing && (
          <p className="text-center text-slate-600 text-xs mt-3">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[11px]">Enter</kbd> to enhance
          </p>
        )}

        {user && history.length > 0 && (
          <HistorySection items={history} onToast={addToast} />
        )}
      </main>

      {/* Zoom modal */}
      {zoomOpen && enhancedUrl && (
        <ImageZoomModal
          imageUrl={enhancedUrl}
          filterStyle={filterStyle}
          onClose={() => setZoomOpen(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
