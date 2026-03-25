# ESRGAN AI Image Enhancer — Project Report

---

## 1. Project Overview

A full-stack AI-powered image enhancement web application. Users upload a low-resolution image,
and the system upscales it using the **Real-ESRGAN** deep learning model (up to 4x resolution),
then stores and serves the result via Cloudinary. User history is persisted in Firebase Firestore.

---

## 2. Technology Stack

| Layer          | Technology                        | Version     | Purpose                              |
|----------------|-----------------------------------|-------------|--------------------------------------|
| Frontend       | Next.js (App Router)              | 16.1.1      | React SSR framework                  |
| Frontend       | React                             | 19.2.3      | UI component library                 |
| Frontend       | TypeScript                        | ^5          | Type safety                          |
| Frontend       | Tailwind CSS                      | ^4          | Utility-first styling                |
| Frontend       | Lucide React                      | ^0.562      | Icon library                         |
| Auth           | Firebase Auth                     | ^12.7       | Google OAuth sign-in                 |
| Database       | Firebase Firestore                | ^12.7       | Enhancement history storage          |
| Storage        | Cloudinary                        | v2          | Image hosting (original + enhanced)  |
| Backend        | Python FastAPI                    | 0.128        | REST API server                      |
| Backend        | PyTorch                           | 2.7.1+cu118 | Deep learning inference              |
| Backend        | OpenCV (cv2)                      | 4.12        | Image decode/encode                  |
| AI Model       | Real-ESRGAN (RRDBNet)             | custom      | 4x super-resolution                  |
| Backend Server | Uvicorn                           | 0.40        | ASGI server                          |

---

## 3. System Architecture

```
+------------------------------------------------------------------+
|                        USER BROWSER                              |
|                                                                  |
|   +--------------------+        +----------------------------+   |
|   |  Next.js Frontend  |        |  Firebase (Auth/Firestore) |   |
|   |  (localhost:3000)  |        +----------------------------+   |
|   |                    |              ^          ^                |
|   | - Navbar           |              | Auth     | History       |
|   | - ImageUploader    |              |          |               |
|   | - EnhancedPreview  |        +-----+----------+-----+         |
|   | - CompareSlider    |        |   useAuth Hook        |         |
|   | - ActionBar        |        +-----------------------+         |
|   | - HistorySection   |                                         |
|   | - Toast            |                                         |
|   +--------+-----------+                                         |
|            |                                                     |
+------------|-----------------------------------------------------+
             |
     +-------+----------+
     |                  |
     v                  v
+----------+    +----------------+
| Cloudinary|    | Python Backend |
| (CDN)     |    | (localhost:8000)|
|           |    |                |
| - Stores  |    | - FastAPI      |
|   original|    | - Real-ESRGAN  |
| - Stores  |    | - Rate limiter |
|   enhanced|    | - Tiling       |
+----------+    +----------------+
                        |
                  +-----+-----+
                  |           |
               GPU/CPU     Cloudinary
               Inference    Upload
```

---

## 4. Enhancement Data Flow (Step-by-Step)

```
User selects image
       |
       v
[ImageUploader] -- validates file type & size (<10MB)
       |
       v
[page.tsx] -- stores File + creates local blob URL for preview
       |
       | Click "Generate High-Res"
       v
[1] uploadImageToCloudinary(file)
       |-- POST /api/sign-cloudinary  --> Next.js API route signs request
       |-- POST Cloudinary upload API --> stores original in "esrgan_uploads/"
       |-- returns originalCloudUrl
       |
[2] POST http://127.0.0.1:8000/enhance
       |   FormData: { file, scale: 2|4 }
       |
       v
  [Python Backend]
       |
       |-- check_rate_limit(ip)    -- blocks if >10 req/min
       |-- cv2.imdecode()          -- decode image bytes to numpy array
       |-- normalize to [0,1]      -- float32 division by 255
       |-- numpy -> PyTorch tensor -- shape: (1, 3, H, W)
       |-- tile_process()          -- 4x upscale via tiling (192px tiles)
       |      |
       |      |-- for each tile:
       |      |     pad with 10px overlap (reflect/replicate)
       |      |     model(tile)  [FP16 on GPU]
       |      |     crop padding from output
       |      |     place in output tensor
       |      |     free VRAM
       |      |
       |      v
       |   4x output tensor (H*4, W*4)
       |
       |-- if scale==2: cv2.resize(output, 50%)  [Lanczos4]
       |-- cv2.imencode(".webp", quality=95)
       |-- cloudinary.uploader.upload() --> stores in "esrgan_enhanced/"
       |-- returns { enhanced_url, processing_time, dimensions }
       |
[3] setEnhancedUrl(data.enhanced_url)
[4] addHistory(originalUrl, enhancedUrl) --> Firestore "enhancements" collection
[5] Toast notification: "Done in Xs — Nx upscale complete!"
       |
       v
User sees enhanced image in EnhancedPreview
       + Compare View / Download / Share buttons appear
```

---

## 5. Frontend Component Tree

```
RootLayout (app/layout.tsx)
  └── AuthProvider (hooks/useAuth.tsx)
        └── Page (app/page.tsx)
              ├── Navbar
              │     ├── [logged out] "Get Started Free" button -> login()
              │     └── [logged in]  Avatar + displayName + Logout
              │
              ├── [compareActive=false]
              │     ├── ImageUploader  (drag-drop / click-to-browse)
              │     │     └── validates: type + size + drag state
              │     └── EnhancedPreview
              │           ├── [isProcessing] spinner + elapsed timer + steps
              │           ├── [imageUrl set] image + dimensions badge + time badge
              │           └── [idle] placeholder
              │
              ├── [compareActive=true]
              │     └── CompareSlider (beforeUrl, afterUrl)
              │           ├── draggable divider (mouse + touch)
              │           ├── Before image (clip-path: left side)
              │           └── After image  (full, behind)
              │
              ├── ActionBar
              │     ├── [no result] Scale selector [2x][4x] + Generate button
              │     └── [result]    Download (.webp/.png/.jpg) + Share + Compare toggle
              │
              ├── HistorySection  (only if user logged in + history.length > 0)
              │     └── HistoryItem grid
              │           └── hover overlay: Open | Download | Delete
              │
              └── ToastContainer (fixed bottom-right)
                    └── Toast (auto-dismiss 4s, success/error/info)
```

---

## 6. Backend Architecture

```
FastAPI App (main.py)
  |
  |-- CORS Middleware         allow_origins from .env (ALLOWED_ORIGIN)
  |-- Rate Limiter            10 req/min per IP (in-memory dict)
  |
  |-- GET  /health            returns { status, device, cuda_available }
  |-- POST /enhance           main endpoint
        |
        |-- params: file (UploadFile), scale (Form: 2 or 4)
        |-- steps:
              1. check_rate_limit(request)
              2. cv2.imdecode(bytes)
              3. normalize + to tensor
              4. tile_process(tensor, scale=4)
              5. if scale==2: resize 50%
              6. imencode .webp quality=95
              7. cloudinary upload
              8. return JSON response

RRDBNet Model Architecture (rrdbnet_arch.py)
  |
  |-- conv_first: Conv2d(3, 64, 3)
  |-- RRDB_trunk: Sequential of 23 x RRDB blocks
  |       RRDB
  |         |-- RDB1 (ResidualDenseBlock_5C)
  |         |     5 dense conv layers, nf=64, gc=32
  |         |-- RDB2
  |         |-- RDB3
  |         |-- residual scale: x * 0.2 + input
  |
  |-- trunk_conv: Conv2d(64, 64)
  |-- upconv1 + PixelShuffle(2)
  |-- upconv2 + PixelShuffle(2)  --> total 4x upscale
  |-- HRconv + conv_last: -> output (3, H*4, W*4)
```

---

## 7. Tiling Strategy (VRAM Optimization)

Without tiling, a single 1080p image would require ~5GB VRAM in FP32.
Tiling breaks the image into small overlapping patches processed one at a time.

```
Input image (e.g. 800x600)
+---+---+---+---+
| 1 | 2 | 3 | 4 |   tile_size = 192px
+---+---+---+---+   tile_pad  = 10px (overlap to avoid seam artifacts)
| 5 | 6 | 7 | 8 |
+---+---+---+---+
| 9 |10 |11 |12 |
+---+---+---+---+

Each tile:
  [192x192] padded -> [212x212] -> model -> [848x848] -> crop pad -> place in output

Output image (3200x2400 for 4x, 1600x1200 for 2x)
VRAM used per tile: ~200MB (FP16) vs ~5GB for full image
```

---

## 8. Database Schema (Firestore)

```
Collection: "enhancements"
  Document ID: auto-generated
  Fields:
    userId      : string   -- Firebase Auth UID
    originalUrl : string   -- Cloudinary URL (esrgan_uploads/)
    enhancedUrl : string   -- Cloudinary URL (esrgan_enhanced/)
    createdAt   : string   -- ISO 8601 timestamp
    status      : string   -- "completed"

Indexes required:
  - (userId ASC, createdAt DESC)  <-- composite index for history query
```

---

## 9. Authentication Flow

```
User clicks "Get Started Free"
       |
       v
signInWithPopup(GoogleAuthProvider)
       |
       v
Firebase Auth popup --> Google OAuth consent
       |
       v
onAuthStateChanged fires --> setUser(firebaseUser)
       |
       v
Firestore listener (onSnapshot) attached to user's enhancements
       |
       v
History loads in real-time (live updates on new enhancements)

Logout:
  signOut(auth) --> setUser(null) --> setHistory([])
```

---

## 10. Environment Variables

### Frontend (.env in project root)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=   # Your Cloudinary cloud name
NEXT_PUBLIC_CLOUDINARY_API_KEY=      # Cloudinary API key (public)
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=# Unsigned upload preset name
CLOUDINARY_API_SECRET=               # Server-side only (signs uploads)
```

### Backend (backend/.env)
```
CLOUDINARY_CLOUD_NAME=               # Same cloud name
CLOUDINARY_API_KEY=                  # Same API key
CLOUDINARY_API_SECRET=               # API secret for direct upload
ALLOWED_ORIGIN=http://localhost:3000 # CORS allowed origin
```

---

## 11. API Reference

### GET /health
**Response:**
```json
{
  "status": "ok",
  "device": "cuda",
  "cuda_available": true
}
```

### POST /enhance
**Request:** `multipart/form-data`
| Field | Type   | Required | Values  | Description              |
|-------|--------|----------|---------|--------------------------|
| file  | File   | Yes      | image/* | PNG, JPG, or WebP file   |
| scale | int    | No       | 2 or 4  | Upscale factor (default 4) |

**Response (200):**
```json
{
  "enhanced_url": "https://res.cloudinary.com/.../enhanced_xxx.webp",
  "original_dimensions": { "width": 640, "height": 480 },
  "output_dimensions":   { "width": 2560, "height": 1920 },
  "scale": 4,
  "processing_time_seconds": 18.4
}
```

**Error Responses:**
| Status | Meaning                                         |
|--------|-------------------------------------------------|
| 400    | Invalid scale value or unreadable image file    |
| 429    | Rate limit exceeded (>10 req/min from same IP)  |
| 500    | Inference or upload failure (see detail field)  |

---

## 12. Features Implemented (Current State)

| Feature                          | Status | Where                              |
|----------------------------------|--------|------------------------------------|
| 4x AI Upscaling (Real-ESRGAN)    | Done   | backend/main.py                    |
| 2x Upscaling (4x + Lanczos4 down)| Done   | backend/main.py                    |
| GPU FP16 inference               | Done   | backend/main.py                    |
| VRAM-safe tiling                 | Done   | tile_process() in main.py          |
| Google OAuth login               | Done   | hooks/useAuth.tsx                  |
| Enhancement history              | Done   | Firestore + HistorySection.tsx     |
| Delete from history              | Done   | HistorySection.tsx                 |
| Download from history            | Done   | HistorySection.tsx                 |
| Cloudinary signed upload         | Done   | lib/cloudinary.ts + api/sign-*     |
| Real drag-and-drop upload        | Done   | components/ImageUploader.tsx       |
| File type + size validation      | Done   | components/ImageUploader.tsx       |
| Before/After compare slider      | Done   | components/CompareSlider.tsx       |
| Mouse + touch drag on slider     | Done   | components/CompareSlider.tsx       |
| Scale selector (2x / 4x)        | Done   | components/ActionBar.tsx           |
| Download format choice           | Done   | ActionBar.tsx (WebP/PNG/JPG)       |
| Canvas-based format conversion   | Done   | ActionBar.tsx                      |
| Share link (copy to clipboard)   | Done   | components/ActionBar.tsx           |
| Toast notifications              | Done   | components/Toast.tsx               |
| Elapsed timer during processing  | Done   | components/EnhancePreview.tsx      |
| Processing steps indicator       | Done   | components/EnhancePreview.tsx      |
| Output dimensions badge          | Done   | components/EnhancePreview.tsx      |
| Processing time badge            | Done   | components/EnhancePreview.tsx      |
| Rate limiting (10 req/min/IP)    | Done   | backend/main.py                    |
| Secrets moved to .env files      | Done   | backend/.env + .env                |
| Configurable CORS                | Done   | backend/main.py (ALLOWED_ORIGIN)   |
| /health endpoint                 | Done   | backend/main.py                    |
| Proper TypeScript types          | Done   | hooks/useAuth.tsx                  |
| App metadata (title/description) | Done   | app/layout.tsx                     |
| Mobile responsive layout         | Done   | app/page.tsx (sm: breakpoints)     |
| Custom scrollbar styling         | Done   | app/globals.css                    |

---

## 13. Potential Future Improvements

| Feature                          | Complexity | Notes                                               |
|----------------------------------|------------|-----------------------------------------------------|
| Face enhancement (GFPGAN)        | High       | Needs separate model (~700MB), face detection pass  |
| Batch image processing           | Medium     | Queue system (e.g. Celery + Redis) on backend       |
| WebSocket progress updates       | Medium     | Real tile-by-tile progress from backend to frontend |
| User usage dashboard             | Low        | Count enhancements, storage used from Firestore     |
| History pagination               | Low        | Firestore cursor-based pagination (startAfter)      |
| Image denoising mode             | High       | Separate BSRGAN or NAFNet model for noise removal   |
| Deploy backend to cloud          | Medium     | Render/Modal/RunPod for GPU serverless hosting      |
| Deploy frontend to Vercel        | Low        | Push to GitHub, connect to Vercel, add env vars     |
| PWA / installable app            | Low        | Add next-pwa, manifest.json, service worker         |
| Original image shown in history  | Low        | Store + display both URLs side-by-side in grid      |

---

## 14. Project File Structure

```
image-enhancer/
  app/
    page.tsx              Main page — orchestrates all state and logic
    layout.tsx            Root layout, AuthProvider wrapper, metadata
    globals.css           Global styles, scrollbar, compare slider
    api/
      sign-cloudinary/
        route.ts          Server-side Cloudinary signature generator
  components/
    Navbar.tsx            Top nav — login/logout, user avatar
    ImageUploader.tsx     Drag-and-drop + click file input
    ImagePreview.tsx      Shows original image with reset button
    EnhancePreview.tsx    Shows result, loading state, elapsed timer
    CompareSlider.tsx     Before/after drag comparison slider
    ActionBar.tsx         Scale selector, Generate/Download/Share buttons
    HistorySection.tsx    History grid with hover actions
    Toast.tsx             Toast notification system
  hooks/
    useAuth.tsx           Auth context — login, logout, history, types
  lib/
    cloudinary.ts         Signed Cloudinary upload function
    firebase.ts           Firebase app init (Auth + Firestore)
  backend/
    main.py               FastAPI server — inference, rate limit, upload
    rrdbnet_arch.py       Real-ESRGAN model architecture (RRDBNet)
    models/
      net_g_latest.pth    Pretrained ESRGAN weights (~64MB)
    .env                  Backend secrets (Cloudinary credentials)
    requirements.txt      Python dependencies
  .env                    Frontend secrets (Cloudinary + Firebase keys)
  package.json            Node.js dependencies
  next.config.ts          Next.js configuration
  tsconfig.json           TypeScript configuration
  PROJECT_REPORT.md       This file
```

---

## 15. How to Run

### Backend
```bash
cd backend
# activate your venv first
source venv/Scripts/activate      # Windows
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
# from project root
npm run dev
# opens at http://localhost:3000
```

### Check backend is healthy
```bash
curl http://127.0.0.1:8000/health
# {"status":"ok","device":"cuda","cuda_available":true}
```
