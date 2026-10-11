/** Shrink a dropped picture so the board can keep it in the browser. */

const MAX_CHARS = 140_000;

export async function pictureDataUrl(file: Blob) {
  const bitmap = await createImageBitmap(file);
  try {
    const passes: Array<[number, number]> = [
      [960, 0.72],
      [720, 0.6],
      [560, 0.5]
    ];
    let url = '';
    for (const [edge, quality] of passes) {
      url = draw(bitmap, edge, quality);
      if (url.length <= MAX_CHARS) return url;
    }
    throw new Error('size');
  } finally {
    bitmap.close();
  }
}

function draw(bitmap: ImageBitmap, edge: number, quality: number) {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}
