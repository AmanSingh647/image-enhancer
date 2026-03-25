"""
convert_to_onnx.py
------------------
Converts the Real-ESRGAN .pth model to ONNX format.

Usage:
    python convert_to_onnx.py

Output:
    models/model.onnx

Requirements (already in your venv):
    torch, onnx

Optional (for verification step):
    pip install onnxruntime        # CPU verification
    pip install onnxruntime-gpu    # GPU verification (if available)
"""

import torch
import numpy as np
import os
import sys

# ── 1. PATHS ──────────────────────────────────────────────────────────────────
PTH_PATH  = "models/net_g_latest.pth"
ONNX_PATH = "models/model.onnx"
OPSET     = 17          # ONNX opset — 17 supports all ops used by RRDBNet
TILE_SIZE = 64          # Dummy input size used during export (any multiple of 4)

# ── 2. LOAD MODEL (same logic as main.py) ─────────────────────────────────────
print("=" * 60)
print("  Real-ESRGAN  →  ONNX Converter")
print("=" * 60)

if not os.path.exists(PTH_PATH):
    print(f"\n[ERROR] Model not found at: {PTH_PATH}")
    print("        Run this script from the 'backend' directory.")
    sys.exit(1)

from rrdbnet_arch import RRDBNet

device = torch.device("cpu")   # Export on CPU — ONNX graph is device-agnostic
print(f"\n[1/5] Loading .pth weights from:  {PTH_PATH}")

model = RRDBNet(
    num_in_ch=3, num_out_ch=3,
    num_feat=64, num_block=23,
    num_grow_ch=32, scale=4
)

loadnet = torch.load(PTH_PATH, map_location=device)

def fix_model_keys(state_dict):
    new_state_dict = {}
    for key, value in state_dict.items():
        k = key
        if "conv_RRDB_trunk" in k: k = k.replace("conv_RRDB_trunk", "trunk_conv")
        elif "conv_body" in k:     k = k.replace("conv_body", "trunk_conv")
        if "body." in k:           k = k.replace("body.", "RRDB_trunk.")
        if "conv_up1" in k:        k = k.replace("conv_up1", "upconv1")
        if "conv_up2" in k:        k = k.replace("conv_up2", "upconv2")
        if "conv_hr" in k:         k = k.replace("conv_hr", "HRconv")
        if "rdb1" in k:            k = k.replace("rdb1", "RDB1")
        if "rdb2" in k:            k = k.replace("rdb2", "RDB2")
        if "rdb3" in k:            k = k.replace("rdb3", "RDB3")
        new_state_dict[k] = value
    return new_state_dict

if "params_ema" in loadnet:   weights = loadnet["params_ema"]
elif "params" in loadnet:     weights = loadnet["params"]
else:                         weights = loadnet

weights = fix_model_keys(weights)
model.load_state_dict(weights, strict=True)
model.eval()
model = model.to(device)
print("    Weights loaded and key-fixed successfully.")

# ── 3. CREATE DUMMY INPUT ─────────────────────────────────────────────────────
print(f"\n[2/5] Creating dummy input tensor: (1, 3, {TILE_SIZE}, {TILE_SIZE})")
dummy_input = torch.randn(1, 3, TILE_SIZE, TILE_SIZE, device=device)

# ── 4. EXPORT TO ONNX ─────────────────────────────────────────────────────────
print(f"\n[3/5] Exporting to ONNX (opset {OPSET})...")
print(f"      Output path: {ONNX_PATH}")
print("      Dynamic axes: batch + height + width  (accepts any image size)")

torch.onnx.export(
    model,
    dummy_input,
    ONNX_PATH,
    opset_version=OPSET,
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={
        "input":  {0: "batch", 2: "height", 3: "width"},
        "output": {0: "batch", 2: "height", 3: "width"},
    },
    do_constant_folding=True,   # folds constant ops → smaller, faster graph
    verbose=False,
)

size_mb = os.path.getsize(ONNX_PATH) / (1024 * 1024)
print(f"    Export complete!  File size: {size_mb:.1f} MB")

# ── 5. VERIFY WITH ONNX (structural check, no runtime needed) ─────────────────
print("\n[4/5] Verifying ONNX graph structure...")
try:
    import onnx
    onnx_model = onnx.load(ONNX_PATH)
    onnx.checker.check_model(onnx_model)
    print("    ONNX graph is valid.")

    # Print input/output shapes
    for inp in onnx_model.graph.input:
        shape = [d.dim_value or d.dim_param for d in inp.type.tensor_type.shape.dim]
        print(f"    Input  '{inp.name}': {shape}")
    for out in onnx_model.graph.output:
        shape = [d.dim_value or d.dim_param for d in out.type.tensor_type.shape.dim]
        print(f"    Output '{out.name}': {shape}")

except ImportError:
    print("    [SKIP] 'onnx' package not installed — skipping graph check.")
    print("           Install with:  pip install onnx")

# ── 6. RUNTIME INFERENCE TEST (optional) ──────────────────────────────────────
print("\n[5/5] Running test inference with ONNX Runtime...")
try:
    import onnxruntime as ort

    # Pick best available provider
    providers = ort.get_available_providers()
    chosen = "CUDAExecutionProvider" if "CUDAExecutionProvider" in providers else "CPUExecutionProvider"
    print(f"    Using provider: {chosen}")

    session = ort.InferenceSession(ONNX_PATH, providers=[chosen])

    # Test with a small 64x64 patch
    test_input = np.random.rand(1, 3, TILE_SIZE, TILE_SIZE).astype(np.float32)
    result = session.run(["output"], {"input": test_input})

    output_shape = result[0].shape
    expected = (1, 3, TILE_SIZE * 4, TILE_SIZE * 4)
    status = "PASS" if output_shape == expected else "FAIL"

    print(f"    Input  shape: {test_input.shape}")
    print(f"    Output shape: {output_shape}  [{status}]")

    if status == "PASS":
        print("\n    4x upscale confirmed working via ONNX Runtime.")
    else:
        print(f"\n    [WARN] Expected {expected}, got {output_shape}")

except ImportError:
    print("    [SKIP] 'onnxruntime' not installed — skipping inference test.")
    print("           Install with:  pip install onnxruntime")
    print("           Or for GPU:    pip install onnxruntime-gpu")

# ── DONE ──────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print(f"  Done!  ONNX model saved to: {ONNX_PATH}")
print("=" * 60)
print("""
Next steps:
  - Use this .onnx file for deployment without PyTorch
  - For 2–4x speedup: convert to TensorRT via trtexec
      trtexec --onnx=models/model.onnx --saveEngine=models/model.trt --fp16
  - For browser deployment: use onnxruntime-web / Transformers.js
""")
