"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import ImagePreview from "@/components/ImagePreview";
import EnhancedPreview from "@/components/EnhancePreview";
import ActionBar from "@/components/ActionBar";
import { useAuth } from "@/hooks/useAuth";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, addHistory } = useAuth();

  const enhanceImage = async () => {
    if (!file) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/enhance", {
      method: "POST",
      body: formData,
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setEnhancedUrl(url);

    if (user) {
      addHistory({
        originalUrl: previewUrl!,
        enhancedUrl: url,
        date: new Date().toISOString(),
      });
    }

    setIsProcessing(false);
  };

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-8">
        <div className="grid md:grid-cols-2 gap-8">
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

          <EnhancedPreview
            isProcessing={isProcessing}
            imageUrl={enhancedUrl}
          />
        </div>

        <ActionBar
          onEnhance={enhanceImage}
          disabled={!previewUrl || isProcessing}
          enhancedUrl={enhancedUrl}
        />
      </main>
    </>
  );
}
