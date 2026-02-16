
export const pixelateImage = (
  imageUrl: string, 
  resolution: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');

      canvas.width = resolution;
      canvas.height = resolution;

      // Draw original image scaled down to target resolution
      // This effectively pixelates it
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, resolution, resolution);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};
