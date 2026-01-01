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
      // 1. Upload Original to Cloudinary immediately
      const originalUrl = await uploadImageToCloudinary(file);

      // 2. Send to your AI Backend
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://127.0.0.1:8000/enhance", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("AI Enhancement failed");

      // 3. Get the enhanced blob and upload IT to Cloudinary
      const enhancedBlob = await res.blob();
      const enhancedUrl = await uploadImageToCloudinary(enhancedBlob);

      // 4. Update the UI
      setEnhancedUrl(enhancedUrl);

      // 5. Save the PERMANENT Cloudinary URLs to Firebase history
      if (user) {
        await addHistory(originalUrl, enhancedUrl);
      }
    } catch (error) {
      console.error("Error in enhancement flow:", error);
      alert("Something went wrong during enhancement.");
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
