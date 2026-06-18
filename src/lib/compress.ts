/**
 * Utility to compress images client-side before uploading to the database.
 * This dramatically reduces the database storage footprint and saves egress bandwidth.
 */
export function compressImage(file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Calculate raw size
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Draw image to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string); // fallback to original
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try to export as WebP, if fails/not preferred, JPEG is universally supported
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          // If the output webpData is actually valid and smaller/same, use it
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch (e) {
          console.warn("WebP compression failed, falling back to JPEG:", e);
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Calculates raw base64 string size in readable format (KB / MB)
 */
export function getBase64Size(base64String: string): string {
  if (!base64String) return '0 KB';
  const stringLength = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = Math.ceil((stringLength * 3) / 4);
  const sizeInKb = sizeInBytes / 1024;
  if (sizeInKb > 1024) {
    return `${(sizeInKb / 1024).toFixed(2)} MB`;
  }
  return `${sizeInKb.toFixed(1)} KB`;
}
