from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import numpy as np
import cv2
import io
import os
import time
from collections import defaultdict

try:
    import torch
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None
    F = None

load_dotenv()

# --- 1. CONFIGURATION ---
app = FastAPI(title="ESRGAN Image Enhancer API")

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = list({o.strip() for o in _raw_origins.split(",") if o.strip()} | {"http://localhost:3000"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# --- 2. SIMPLE IN-MEMORY RATE LIMITER (10 requests/min per IP) ---
_request_log: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 60  # seconds

def check_rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - RATE_WINDOW
    _request_log[ip] = [t for t in _request_log[ip] if t > window_start]
    if len(_request_log[ip]) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {RATE_LIMIT} requests per minute. Try again shortly."
        )
    _request_log[ip].append(now)

# --- 3. LOAD MODEL ---
USE_ONNX = False
ort_session = None
model = None
device = None

if TORCH_AVAILABLE:
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"PyTorch available. Using device: {device}")

    try:
        from rrdbnet_arch import RRDBNet

        def fix_model_keys(state_dict):
            new_state_dict = {}
            for key, value in state_dict.items():
                new_key = key
                if "conv_RRDB_trunk" in new_key: new_key = new_key.replace("conv_RRDB_trunk", "trunk_conv")
                elif "conv_body" in new_key: new_key = new_key.replace("conv_body", "trunk_conv")
                if "body." in new_key: new_key = new_key.replace("body.", "RRDB_trunk.")
                if "conv_up1" in new_key: new_key = new_key.replace("conv_up1", "upconv1")
                if "conv_up2" in new_key: new_key = new_key.replace("conv_up2", "upconv2")
                if "conv_hr" in new_key: new_key = new_key.replace("conv_hr", "HRconv")
                if "rdb1" in new_key: new_key = new_key.replace("rdb1", "RDB1")
                if "rdb2" in new_key: new_key = new_key.replace("rdb2", "RDB2")
                if "rdb3" in new_key: new_key = new_key.replace("rdb3", "RDB3")
                new_state_dict[new_key] = value
            return new_state_dict

        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        loadnet = torch.load('models/net_g_latest.pth', map_location=device)

        if 'params_ema' in loadnet: weights = loadnet['params_ema']
        elif 'params' in loadnet: weights = loadnet['params']
        else: weights = loadnet

        weights = fix_model_keys(weights)
        model.load_state_dict(weights, strict=True)
        model.eval()
        if device.type == 'cuda':
            model = model.half()
        model = model.to(device)
        print("PyTorch model (net_g_latest.pth) loaded successfully!")

    except Exception as e:
        print(f"PyTorch model load failed ({e}), trying ONNX fallback...")
        model = None

if model is None:
    try:
        import onnxruntime as ort
        ort_session = ort.InferenceSession(
            'models/model.onnx',
            providers=['CPUExecutionProvider']
        )
        USE_ONNX = True
        print("ONNX model (model.onnx) loaded — running on CPU.")
    except Exception as e:
        print(f"CRITICAL: No model could be loaded! {e}")

# --- 4. TILING FUNCTION ---
def tile_process(img, scale=4, tile_size=192, tile_pad=10):
    _, _, h, w = img.shape
    output_h, output_w = h * scale, w * scale
    output = torch.zeros((1, 3, output_h, output_w), device=device)

    if device.type == 'cuda':
        img = img.half()

    for i in range(0, h, tile_size):
        for j in range(0, w, tile_size):
            h_start, w_start = i, j
            h_end = min(h_start + tile_size, h)
            w_end = min(w_start + tile_size, w)

            input_tile = img[:, :, h_start:h_end, w_start:w_end]

            pad_h_top = tile_pad if h_start > 0 else 0
            pad_h_bot = tile_pad if h_end < h else 0
            pad_w_left = tile_pad if w_start > 0 else 0
            pad_w_right = tile_pad if w_end < w else 0

            current_h = h_end - h_start
            current_w = w_end - w_start
            can_reflect = (current_h > pad_h_top) and (current_h > pad_h_bot) and \
                          (current_w > pad_w_left) and (current_w > pad_w_right)
            pad_mode = 'reflect' if can_reflect else 'replicate'

            input_tile_padded = F.pad(input_tile, (pad_w_left, pad_w_right, pad_h_top, pad_h_bot), pad_mode)

            with torch.no_grad():
                output_tile_padded = model(input_tile_padded)

            crop_h_top = pad_h_top * scale
            crop_h_bot = pad_h_bot * scale
            crop_w_left = pad_w_left * scale
            crop_w_right = pad_w_right * scale

            h_end_out = output_tile_padded.shape[2] - crop_h_bot
            w_end_out = output_tile_padded.shape[3] - crop_w_right
            output_tile = output_tile_padded[:, :, crop_h_top:h_end_out, crop_w_left:w_end_out]

            out_h_start = h_start * scale
            out_w_start = w_start * scale
            output[:, :, out_h_start:out_h_start + output_tile.shape[2],
                         out_w_start:out_w_start + output_tile.shape[3]] = output_tile.float()

            del input_tile, input_tile_padded, output_tile_padded, output_tile
            if device.type == 'cuda':
                torch.cuda.empty_cache()

    return output

def tensor2img(tensor):
    output = tensor.squeeze(0).detach().cpu().clamp_(0, 1).numpy()
    output = np.transpose(output[[2, 1, 0], :, :], (1, 2, 0))
    output = (output * 255.0).round().astype(np.uint8)
    return output

def tile_process_onnx(img_np, scale=4, tile_size=192, tile_pad=10):
    _, _, h, w = img_np.shape
    output = np.zeros((1, 3, h * scale, w * scale), dtype=np.float32)
    input_name = ort_session.get_inputs()[0].name

    for i in range(0, h, tile_size):
        for j in range(0, w, tile_size):
            h_start, w_start = i, j
            h_end = min(h_start + tile_size, h)
            w_end = min(w_start + tile_size, w)

            input_tile = img_np[:, :, h_start:h_end, w_start:w_end]

            pad_h_top = tile_pad if h_start > 0 else 0
            pad_h_bot = tile_pad if h_end < h else 0
            pad_w_left = tile_pad if w_start > 0 else 0
            pad_w_right = tile_pad if w_end < w else 0

            th, tw = input_tile.shape[2], input_tile.shape[3]
            can_reflect = th > pad_h_top and th > pad_h_bot and tw > pad_w_left and tw > pad_w_right
            pad_mode = 'reflect' if can_reflect else 'edge'

            input_tile_padded = np.pad(
                input_tile,
                ((0, 0), (0, 0), (pad_h_top, pad_h_bot), (pad_w_left, pad_w_right)),
                mode=pad_mode
            )

            out_padded = ort_session.run(None, {input_name: input_tile_padded})[0]

            crop_h2 = out_padded.shape[2] - pad_h_bot * scale
            crop_w2 = out_padded.shape[3] - pad_w_right * scale
            out_tile = out_padded[:, :, pad_h_top * scale:crop_h2, pad_w_left * scale:crop_w2]

            output[:, :,
                   h_start * scale:h_start * scale + out_tile.shape[2],
                   w_start * scale:w_start * scale + out_tile.shape[3]] = out_tile

    return output

# --- 5. API ENDPOINTS ---
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "mode": "onnx-cpu" if USE_ONNX else f"pytorch-{device}",
        "cuda_available": bool(TORCH_AVAILABLE and torch and torch.cuda.is_available()),
    }

@app.post("/enhance")
async def enhance_image(
    request: Request,
    file: UploadFile = File(...),
    scale: int = Form(4),
):
    check_rate_limit(request)

    if scale not in (2, 4):
        raise HTTPException(status_code=400, detail="scale must be 2 or 4")

    print(f"Received file: {file.filename} | scale: {scale}x")
    start_time = time.time()

    try:
        # A. Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image. Please upload a valid PNG/JPG/WebP file.")

        original_h, original_w = img.shape[:2]

        # B. Preprocess + C. Inference (always 4x via tiling)
        print("Starting AI Inference (Tiling Mode)...")
        img_f = img.astype(np.float32) / 255.

        if USE_ONNX:
            img_np = np.transpose(img_f[:, :, [2, 1, 0]], (2, 0, 1))[np.newaxis, ...].astype(np.float32)
            out_np = tile_process_onnx(img_np, scale=4, tile_size=192, tile_pad=10)
            out_np = np.transpose(out_np.squeeze(0)[[2, 1, 0], :, :], (1, 2, 0))
            output_img = np.clip(out_np * 255, 0, 255).astype(np.uint8)
        else:
            img_t = torch.from_numpy(np.transpose(img_f[:, :, [2, 1, 0]], (2, 0, 1))).float()
            img_t = img_t.unsqueeze(0).to(device)
            output = tile_process(img_t, scale=4, tile_size=192, tile_pad=10)
            output_img = tensor2img(output)

        # D. If user requested 2x, downsample the 4x result by 50%
        if scale == 2:
            h4, w4 = output_img.shape[:2]
            output_img = cv2.resize(output_img, (w4 // 2, h4 // 2), interpolation=cv2.INTER_LANCZOS4)
            print("Downsampled 4x result to 2x via Lanczos4")

        final_h, final_w = output_img.shape[:2]
        print(f"Inference complete: {original_w}x{original_h} -> {final_w}x{final_h}")

        # E. Encode as WebP and upload to Cloudinary
        encode_param = [int(cv2.IMWRITE_WEBP_QUALITY), 95]
        is_success, buffer = cv2.imencode(".webp", output_img, encode_param)
        if not is_success:
            raise RuntimeError("Failed to encode output image")
        io_buf = io.BytesIO(buffer)

        upload_result = cloudinary.uploader.upload(
            io_buf,
            folder="esrgan_enhanced",
            public_id=f"enhanced_{file.filename.split('.')[0]}_{int(time.time())}",
            resource_type="image"
        )

        elapsed = round(time.time() - start_time, 2)
        print(f"Done in {elapsed}s | URL: {upload_result['secure_url']}")

        return {
            "enhanced_url": upload_result["secure_url"],
            "original_dimensions": {"width": original_w, "height": original_h},
            "output_dimensions": {"width": final_w, "height": final_h},
            "scale": scale,
            "processing_time_seconds": elapsed,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
