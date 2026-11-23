const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const TARGET_AVATAR_SIZE_PX = 320;
const OUTPUT_QUALITY = 0.82;

export const AVATAR_ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";

/**
 * Valida, recorta en proporción 1:1 (encuadre centrado) y comprime una imagen
 * en el navegador para almacenarla de forma eficiente en Firebase Realtime Database
 * como Data URL (Base64 ~15–45 KB).
 */
export async function processAvatarImage(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error(
      "Formato no admitido. Usa una imagen JPG, PNG o WEBP.",
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("La imagen supera el tamaño máximo permitido de 5 MB.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error("No se pudo leer el archivo de imagen."));
      image.src = objectUrl;
    });

    const sourceSide = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = Math.floor((img.naturalWidth - sourceSide) / 2);
    const sy = Math.floor((img.naturalHeight - sourceSide) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_AVATAR_SIZE_PX;
    canvas.height = TARGET_AVATAR_SIZE_PX;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No se pudo inicializar el procesador de imagen.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      sx,
      sy,
      sourceSide,
      sourceSide,
      0,
      0,
      TARGET_AVATAR_SIZE_PX,
      TARGET_AVATAR_SIZE_PX,
    );

    const webpDataUrl = canvas.toDataURL("image/webp", OUTPUT_QUALITY);
    if (webpDataUrl.startsWith("data:image/webp")) {
      return webpDataUrl;
    }

    return canvas.toDataURL("image/jpeg", OUTPUT_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
