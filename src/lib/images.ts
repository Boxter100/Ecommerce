export const IMAGE_BUCKET = 'products';
export const IMAGE_MIME = 'image/webp';
export const IMAGE_EXTENSION = '.webp';
export const IMAGE_SIZE = 1024;
export const IMAGE_QUALITY = 0.82;
export const IMAGE_MAX_MB = 10;
export const IMAGE_MAX_BYTES = IMAGE_MAX_MB * 1024 * 1024;

export function isWebpFile(file: File): boolean {
  return file.type === IMAGE_MIME || file.name.toLowerCase().endsWith(IMAGE_EXTENSION);
}

export function validateImageFile(file: File): string | null {
  if (!isWebpFile(file)) {
    return 'solo se admite el formato .webp';
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `supera el límite de ${IMAGE_MAX_MB} MB`;
  }
  return null;
}

export function uniqueImagePath(): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `products/${id}${IMAGE_EXTENSION}`;
}

export async function fileToSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);

    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_SIZE;
    canvas.height = IMAGE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, IMAGE_SIZE, IMAGE_SIZE);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('No se pudo generar la imagen WebP'));
        },
        IMAGE_MIME,
        IMAGE_QUALITY,
      );
    });
    return blob;
  } finally {
    bitmap.close();
  }
}