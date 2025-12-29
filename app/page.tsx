
// "use client";

// import { useState } from "react";
// import { Upload, ImageIcon, Sparkles, Download, RefreshCw } from "lucide-react"; // Install with: npm install lucide-react

// export default function Home() {
//   const [file, setFile] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
//     let selectedFile: File | undefined;
    
//     if ('files' in e.target) {
//       selectedFile = e.target.files?.[0];
//     } else if ('dataTransfer' in e) {
//       e.preventDefault();
//       selectedFile = e.dataTransfer.files?.[0];
//     }

//     if (!selectedFile) return;

//     if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
//       alert("Please upload a JPG or PNG image.");
//       return;
//     }

//     setFile(selectedFile);
//     setPreviewUrl(URL.createObjectURL(selectedFile));
//     setEnhancedUrl(null); // Reset when a new image is uploaded
//   };

//   const handleEnhance = async () => {
//     setIsProcessing(true);
//     // This is where you will eventually fetch your /api/enhance route
//     setTimeout(() => {
//       setIsProcessing(false);
//       setEnhancedUrl(previewUrl); // Mocking the result for now
//       alert("Backend integration is the next step!");
//     }, 3000);
//   };

//   return (
//     <main className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
//       <div className="max-w-5xl mx-auto">
//         {/* Header section as per your proposal [cite: 11] */}
//         <header className="text-center mb-12">
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
//             ESRGAN Image Restorer
//           </h1>
//           <p className="text-slate-500">4x Super-Resolution AI Enhancement [cite: 22]</p>
//         </header>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {/* Left Column: Input/Original */}
//           <div className="space-y-4">
//             <h2 className="text-lg font-medium flex items-center gap-2">
//               <ImageIcon className="w-5 h-5" /> Original Image
//             </h2>
            
//             {!previewUrl ? (
//               <div 
//                 onDragOver={(e) => e.preventDefault()}
//                 onDrop={handleFileChange}
//                 className="border-2 border-dashed border-slate-300 rounded-2xl h-80 flex flex-col items-center justify-center bg-white hover:border-blue-400 transition-colors cursor-pointer relative"
//               >
//                 <input 
//                   type="file" 
//                   className="absolute inset-0 opacity-0 cursor-pointer" 
//                   onChange={handleFileChange}
//                   accept="image/png, image/jpeg"
//                 />
//                 <div className="bg-blue-50 p-4 rounded-full mb-4">
//                   <Upload className="w-8 h-8 text-blue-600" />
//                 </div>
//                 <p className="font-medium">Click or drag image here</p>
//                 <p className="text-sm text-slate-400">Supports JPG, PNG (Max 5MB)</p>
//               </div>
//             ) : (
//               <div className="relative rounded-2xl overflow-hidden border bg-white h-80">
//                 <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
//                 <button 
//                   onClick={() => setPreviewUrl(null)}
//                   className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
//                 >
//                   <RefreshCw className="w-4 h-4" />
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Right Column: Output/Enhanced */}
//           <div className="space-y-4">
//             <h2 className="text-lg font-medium flex items-center gap-2">
//               <Sparkles className="w-5 h-5 text-indigo-500" /> Enhanced Result
//             </h2>
//             <div className="border-2 border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center bg-slate-100 overflow-hidden relative">
//               {isProcessing ? (
//                 <div className="text-center">
//                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                   <p className="text-slate-500 animate-pulse">Running ESRGAN Inference... </p>
//                 </div>
//               ) : enhancedUrl ? (
//                 <img src={enhancedUrl} alt="Enhanced" className="w-full h-full object-contain bg-white" />
//               ) : (
//                 <p className="text-slate-400">Enhanced image will appear here</p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Action Bar  */}
//         <div className="mt-12 flex flex-col items-center gap-4">
//           <button
//             onClick={handleEnhance}
//             disabled={!previewUrl || isProcessing}
//             className="group flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all"
//           >
//             {isProcessing ? "Enhancing..." : "Start AI Enhancement"}
//             <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
//           </button>
          
//           {enhancedUrl && (
//             <a 
//               href={enhancedUrl} 
//               download="enhanced-image.png"
//               className="flex items-center gap-2 text-blue-600 font-medium hover:underline"
//             >
//               <Download className="w-4 h-4" /> Download High-Res Output 
//             </a>
//           )}
//         </div>
//       </div>
//     </main>
//   );
// }

"use client";

import { useState } from "react";
import { Upload, ImageIcon, Sparkles, Download, RefreshCw } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let selectedFile: File | undefined;

    if ('files' in e.target) {
      selectedFile = e.target.files?.[0];
    } else if ('dataTransfer' in e) {
      e.preventDefault();
      selectedFile = e.dataTransfer.files?.[0];
    }

    if (!selectedFile) return;

    if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
      alert("Please upload a JPG or PNG image.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setEnhancedUrl(null);
  };

  const handleEnhance = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:8000/enhance", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to enhance image");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setEnhancedUrl(url);

    } catch (error) {
      console.error(error);
      alert("Error enhancing image. Make sure backend is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            ESRGAN Image Restorer
          </h1>
          <p className="text-slate-500">4x Super-Resolution AI Enhancement [cite: 22]</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> Original Image
            </h2>
            
            {!previewUrl ? (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileChange}
                className="border-2 border-dashed border-slate-300 rounded-2xl h-80 flex flex-col items-center justify-center bg-white hover:border-blue-400 transition-colors cursor-pointer relative"
              >
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                />
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="font-medium">Click or drag image here</p>
                <p className="text-sm text-slate-400">Supports JPG, PNG (Max 5MB)</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border bg-white h-80">
                <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
                <button 
                  onClick={() => { setPreviewUrl(null); setFile(null); }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Enhanced Result
            </h2>
            <div className="border-2 border-slate-200 rounded-2xl h-80 flex flex-col items-center justify-center bg-slate-100 overflow-hidden relative">
              {isProcessing ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-500 animate-pulse">Running ESRGAN Inference...</p>
                </div>
              ) : enhancedUrl ? (
                <img src={enhancedUrl} alt="Enhanced" className="w-full h-full object-contain bg-white" />
              ) : (
                <p className="text-slate-400">Enhanced image will appear here</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={handleEnhance}
            disabled={!previewUrl || isProcessing}
            className="group flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all"
          >
            {isProcessing ? "Enhancing..." : "Start AI Enhancement"}
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
          
          {enhancedUrl && (
            <a 
              href={enhancedUrl} 
              download="enhanced-image.png"
              className="flex items-center gap-2 text-blue-600 font-medium hover:underline"
            >
              <Download className="w-4 h-4" /> Download High-Res Output 
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
