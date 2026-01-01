"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import ImagePreview from "@/components/ImagePreview";
import EnhancedPreview from "@/components/EnhancePreview";
import ActionBar from "@/components/ActionBar";
import HistorySection from "@/components/HistorySection";
import { useAuth } from "@/hooks/useAuth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export default function Page() {
  const { user, addHistory, history, loading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_unsigned_preset"); // Create this in Cloudinary settings
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const enhanceImage = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      // 1. Upload Original to Cloudinary (Keep this for history)
      const originalCloudUrl = await uploadImageToCloudinary(file);

      // 2. Send File to Python Backend
      const formData = new FormData();
      formData.append("file", file); // Must match the @app.post parameter name

      const res = await fetch("http://127.0.0.1:8000/enhance", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Python Backend Failed");

      const data = await res.json();
      const enhancedCloudUrl = data.enhanced_url; // Backend returns the Cloudinary URL directly

      setEnhancedUrl(enhancedCloudUrl);

      // 3. Save to Firestore History
      if (user) {
        await addHistory(originalCloudUrl, enhancedCloudUrl);
      }
    } catch (e) {
      console.error(e);
      alert("Enhancement failed! Is the Python server running?");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Workspace Section */}
        <section className="grid lg:grid-cols-2 gap-8 mb-20">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-indigo-400">
              Step 1: Upload Source
            </h2>
            {previewUrl ? (
              <ImagePreview
                url={previewUrl}
                onReset={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setEnhancedUrl(null);
                }}
              />
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
            />
          </div>
        </section>

        <ActionBar
          onEnhance={enhanceImage}
          disabled={!previewUrl || isProcessing}
          enhancedUrl={enhancedUrl}
        />

        {/* History Section - Only for logged in users */}
        {user && history.length > 0 && <HistorySection items={history} />}
      </main>
    </div>
  );
}
