/**
 * Compress an image file to meet size requirements
 * Converts to WEBP format and reduces quality/resolution as needed
 */
export async function compressImage(file: File, maxSizeBytes = 1024 * 1024): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = async () => {
        let quality = 0.8;
        let maxWidth = 1920;
        let maxHeight = 1080;
        let compressed: File | null = null;

        // Try compression with decreasing quality
        while (quality > 0.1) {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Resize if needed
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/webp', quality);
          });

          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Check size
          if (blob.size <= maxSizeBytes) {
            const fileName = file.name.replace(/\.[^/.]+$/, '.webp');
            compressed = new File([blob], fileName, { type: 'image/webp' });
            break;
          }

          // Reduce quality for next iteration
          quality -= 0.1;
          
          // Also reduce resolution if quality is getting too low
          if (quality < 0.5) {
            maxWidth = Math.floor(maxWidth * 0.8);
            maxHeight = Math.floor(maxHeight * 0.8);
          }
        }

        if (compressed) {
          resolve(compressed);
        } else {
          reject(new Error('Could not compress image to required size'));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate and prepare image file for upload
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  const maxSize = 1024 * 1024; // 1MB
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, WEBP, or AVIF image.');
  }

  // Validate file name (only English letters and numbers)
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  if (!/^[a-zA-Z0-9_-]+$/.test(fileNameWithoutExt)) {
    throw new Error('File name must contain only English letters, numbers, hyphens, and underscores.');
  }

  // Compress if needed
  if (file.size > maxSize) {
    return await compressImage(file, maxSize);
  }

  return file;
}

/**
 * Generate a unique file path for storage
 */
export function generateStoragePath(userId: string, category: string, fileName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${category}/${userId}/${timestamp}_${randomStr}_${sanitizedFileName}`;
}
