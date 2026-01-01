import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST() {
  const timestamp = Math.round(new Date().getTime() / 1000);

  // Create the signature
  // We sign the 'timestamp' and optionally the 'folder' or 'eager' transformations
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: "esrgan_uploads", // Optional: Organize your uploads
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({ timestamp, signature });
}
