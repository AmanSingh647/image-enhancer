export const uploadImageToCloudinary = async (
  file: File | Blob
): Promise<string> => {
  // Step 1: Get the signature from your own backend
  const signRes = await fetch("/api/sign-cloudinary", { method: "POST" });
  if (!signRes.ok) throw new Error("Failed to sign upload request");
  const { timestamp, signature } = await signRes.json();

  // Step 2: Upload to Cloudinary using the signature
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", "esrgan_uploads"); // Must match what you signed in the API route!

  // Note: We NO LONGER send 'upload_preset' for signed uploads usually,
  // unless you have a specific signed preset you want to use.

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Cloudinary upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};
