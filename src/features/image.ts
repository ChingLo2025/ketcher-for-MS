// Pixels per SVG unit. PowerPoint places pasted bitmaps at 96 DPI, so this also sets the pasted size
// (2 = twice the on-screen size, still sharp after shrinking).
const PNG_SCALE = 2;

/** Rasterise the SVG to a transparent PNG, the format placed on the clipboard for PowerPoint. */
export async function svgToPng(svg: string, scale = PNG_SCALE): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(img.naturalWidth * scale);
    canvas.height = Math.ceil(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
