"use client";
import { useCallback, useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import ImagePreview from "@/components/ImagePreview";
import EnhancedPreview from "@/components/EnhancePreview";
import ActionBar from "@/components/ActionBar";
import HistorySection from "@/components/HistorySection";
import CompareSlider from "@/components/CompareSlider";
import ToastContainer, { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/hooks/useAuth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

interface EnhanceResult {
  enhanced_url: string;
  processing_time_seconds: number;
  output_dimensions: { width: number; height: number };
  scale: number;
}

export default function Page() {
  const { user, addHistory, history } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState<number>(4);
  const [compareActive, setCompareActive] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [outputDimensions, setOutputDimensions] = useState<{ width: number; height: number } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
    setProcessingTime(null);
    setOutputDimensions(null);
  };

  const enhanceImage = async () => {
    if (!file) return;
    setIsProcessing(true);
    setEnhancedUrl(null);
    setCompareActive(false);

    try {
      // 1. Upload original to Cloudinary for history
      const originalCloudUrl = await uploadImageToCloudinary(file);

      // 2. Send file + scale to Python backend
      const formData = new FormData();
      formData.append("file", file);
      formData.append("scale", String(scale));

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";
      const res = await fetch(`${backendUrl}/enhance`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        if (res.status === 429) {
          addToast("error", "Rate limit reached. Please wait a moment before trying again.");
        } else {
          addToast("error", `Enhancement failed: ${err.detail || res.statusText}`);
        }
        return;
      }

      const data: EnhanceResult = await res.json();
      setEnhancedUrl(data.enhanced_url);
      setProcessingTime(data.processing_time_seconds);
      setOutputDimensions(data.output_dimensions);

      addToast("success", `Done in ${data.processing_time_seconds}s — ${data.scale}x upscale complete!`);

      // 3. Save to Firestore history
      if (user) {
        await addHistory(originalCloudUrl, data.enhanced_url);
      }
    } catch (e) {
      console.error(e);
      addToast("error", "Could not reach the Python backend. Is it running on port 8000?");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">

        {/* Compare view — full width when active */}
        {compareActive && previewUrl && enhancedUrl ? (
          <section className="mb-10">
            <CompareSlider beforeUrl={previewUrl} afterUrl={enhancedUrl} />
          </section>
        ) : (
          /* Normal two-column workspace */
          <section className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-indigo-400">
                Step 1: Upload Source
              </h2>
              {previewUrl ? (
                <ImagePreview url={previewUrl} onReset={handleReset} />
              ) : (
                <ImageUploader
                  onFileSelect={(f) => {
                    setFile(f);
                    setPreviewUrl(URL.createObjectURL(f));
                  }}
                />
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-cyan-400">
                Step 2: AI Result
              </h2>
              <EnhancedPreview
                isProcessing={isProcessing}
                imageUrl={enhancedUrl}
                processingTime={processingTime}
                outputDimensions={outputDimensions}
              />
            </div>
          </section>
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
        />

        {/* History — only for logged-in users */}
        {user && history.length > 0 && (
          <HistorySection items={history} onToast={addToast} />
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
