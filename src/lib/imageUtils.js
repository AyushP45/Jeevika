/**
 * Compresses an image using a canvas to reduce file size before uploading.
 * @param {string} base64 - The source base64 image string.
 * @param {number} maxWidth - Maximum width for the compressed image.
 * @param {number} quality - Compression quality (0 to 1).
 * @returns {Promise<string>} - Compressed base64 string.
 */
export async function compressImage(base64, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = (err) => reject(err);
  });
}
