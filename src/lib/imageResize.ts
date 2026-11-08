/** Verkleinert ein Bild auf ein quadratisches JPEG (Daten-URL), damit es im Tisch gespeichert werden kann. */
export function resizeImageFile(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Bitte wähle eine Bilddatei."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Bild konnte nicht verarbeitet werden."));
        return;
      }
      // Mittig quadratisch zuschneiden
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Das Bild konnte nicht gelesen werden."));
    };
    img.src = url;
  });
}
