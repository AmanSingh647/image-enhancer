from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cloudinary
import cloudinary.uploader
import torch
import torch.nn.functional as F
import numpy as np
import cv2
import io
import math

# --- 1. CONFIGURATION ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins (fixes CORS issues)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cloudinary.config( 
  cloud_name = "de8flo0fp", 
  api_key = "687153717926454", 
  api_secret = "tQ6lG5v0ZMuWAAK5A_5uOrPyed0" 
)

# --- 2. LOAD MODEL (With Key Fixer) ---
from rrdbnet_arch import RRDBNet 

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"✅ Using device: {device}")

model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)

try:
    loadnet = torch.load('models/net_g_latest.pth', map_location=device)
    
    # Key Fixer Function
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

    # Handle params_ema
    if 'params_ema' in loadnet: weights = loadnet['params_ema']
    elif 'params' in loadnet: weights = loadnet['params']
    else: weights = loadnet
    
    weights = fix_model_keys(weights)
    model.load_state_dict(weights, strict=True)
    model.eval()
    model = model.to(device)
    print("✅ Model loaded successfully!")

except Exception as e:
    print(f"❌ Error loading model: {e}")

# --- 3. TILING FUNCTION (Saves RAM) ---
def tile_process(img, scale=4, tile_size=192, tile_pad=10):
    """
    Splits image into tiles, processes them, and merges them.
    tile_size=192 is small enough for low-end GPUs/CPUs.
    """
    _, _, h, w = img.shape
    output_h, output_w = h * scale, w * scale
    
    # Empty tensor for result
    output = torch.zeros((1, 3, output_h, output_w), device=device)

    # Loop through tiles
    for i in range(0, h, tile_size):
        for j in range(0, w, tile_size):
            # 1. Get tile coordinates (with padding)
            h_start = i
            w_start = j
            h_end = min(h_start + tile_size, h)
            w_end = min(w_start + tile_size, w)

            # 2. Extract input tile
            input_tile = img[:, :, h_start:h_end, w_start:w_end]

            # 3. Add Padding to avoid edge artifacts
            pad_h_top = tile_pad if h_start > 0 else 0
            pad_h_bot = tile_pad if h_end < h else 0
            pad_w_left = tile_pad if w_start > 0 else 0
            pad_w_right = tile_pad if w_end < w else 0

            input_tile_padded = F.pad(input_tile, (pad_w_left, pad_w_right, pad_h_top, pad_h_bot), 'reflect')

            # 4. RUN MODEL
            with torch.no_grad():
                output_tile_padded = model(input_tile_padded)

            # 5. Crop the padding from the output
            # (Remember output is 4x larger, so multiply pads by scale)
            crop_h_top = pad_h_top * scale
            crop_h_bot = pad_h_bot * scale
            crop_w_left = pad_w_left * scale
            crop_w_right = pad_w_right * scale
            
            # Remove padding
            h_end_out = output_tile_padded.shape[2] - crop_h_bot
            w_end_out = output_tile_padded.shape[3] - crop_w_right
            output_tile = output_tile_padded[:, :, crop_h_top:h_end_out, crop_w_left:w_end_out]

            # 6. Place into final image
            out_h_start = h_start * scale
            out_w_start = w_start * scale
            output[:, :, out_h_start:out_h_start + output_tile.shape[2], 
                         out_w_start:out_w_start + output_tile.shape[3]] = output_tile
            
            # Explicitly clear cache to save RAM
            del input_tile, input_tile_padded, output_tile_padded, output_tile
            torch.cuda.empty_cache()

    return output

def tensor2img(tensor):
    output = tensor.squeeze(0).detach().cpu().clamp_(0, 1).numpy()
    output = np.transpose(output[[2, 1, 0], :, :], (1, 2, 0)) # RGB -> BGR
    output = (output * 255.0).round().astype(np.uint8)
    return output

# --- 4. API ENDPOINT ---
@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    print(f"📥 Received file: {file.filename}")
    try:
        # A. Read Image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # B. Preprocess
        img = img.astype(np.float32) / 255.
        img = torch.from_numpy(np.transpose(img[:, :, [2, 1, 0]], (2, 0, 1))).float()
        img = img.unsqueeze(0).to(device)

        # C. Inference (USING TILING)
        print("⚡ Starting AI Inference (Tiling Mode)...")
        output = tile_process(img, scale=4, tile_size=192, tile_pad=10)
        output_img = tensor2img(output)
        print("✅ Inference Complete")

        # D. Upload to Cloudinary
        print("☁️ Uploading to Cloudinary...")
        is_success, buffer = cv2.imencode(".png", output_img)
        io_buf = io.BytesIO(buffer)

        upload_result = cloudinary.uploader.upload(
            io_buf, 
            folder="esrgan_enhanced",
            public_id=f"enhanced_{file.filename.split('.')[0]}"
        )
        print(f"🎉 Upload Success: {upload_result['secure_url']}")

        return {
            "original_url": "handled_by_frontend", 
            "enhanced_url": upload_result["secure_url"]
        }

    except Exception as e:
        print(f"❌ CRITICAL ERROR: {str(e)}")
        # This will send the EXACT error to the frontend console
        raise HTTPException(status_code=500, detail=str(e))