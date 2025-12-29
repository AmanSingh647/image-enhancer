from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
import io

# After creating FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Backend running"}

@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    image = Image.open(file.file)

    # TEMP: just return the same image
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=image.format)
    img_byte_arr.seek(0)

    return StreamingResponse(img_byte_arr, media_type=file.content_type)
