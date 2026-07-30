/** Client-side image helpers for profile / progress uploads. */

/** Read a File as a resized JPEG data URL (keeps localStorage payloads manageable). */
export async function fileToResizedDataUrl(file: File, max = 720, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        // White fill helps JPEG encode sparse printout photos more cleanly.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Higher-res resize for dense InBody 270 result sheets.
 * Keeps small type (SMM / PBF / BMR) readable for vision models.
 */
export async function fileToInBodyDataUrl(file: File): Promise<string> {
  return fileToResizedDataUrl(file, 2200, 0.92);
}
