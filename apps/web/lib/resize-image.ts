// Shrinks a photo to ≤1600px on its long side and re-encodes as JPEG before upload.
// JPEG, not WebP: Safari's canvas can't encode WebP. iOS hands HEIC over as JPEG already.
export async function resizeToJpeg(file: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that photo."))), "image/jpeg", 0.85),
  );
}
