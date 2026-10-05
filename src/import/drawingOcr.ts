/** Read measurements printed inside a drawing that was saved as pictures. */

import { hasMeasures, readDrawing } from './drawing.js';

function band(bitmap: ImageBitmap, top: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, top, bitmap.width, height, 0, 0, bitmap.width, height);
  return canvas;
}

function bands(bitmap: ImageBitmap) {
  if (bitmap.height <= 1400) {
    const only = band(bitmap, 0, bitmap.height);
    return only ? [only] : [];
  }
  const height = Math.ceil(bitmap.height / 3);
  const slices = [];
  for (let top = 0; top < bitmap.height; top += height) {
    const slice = band(bitmap, top, Math.min(height, bitmap.height - top));
    if (slice) slices.push(slice);
  }
  return slices;
}

const OCR_SIDE = 2400;

async function limitBitmap(bitmap: ImageBitmap) {
  const long = Math.max(bitmap.width, bitmap.height);
  if (long <= OCR_SIDE) return bitmap;
  const scale = OCR_SIDE / long;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return bitmap;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return createImageBitmap(canvas);
}

async function textFromBitmaps(bitmaps: ImageBitmap[]) {
  if (!bitmaps.length || typeof createImageBitmap !== 'function') return '';
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const parts: string[] = [];
    for (const bitmap of bitmaps) {
      const slices = bands(bitmap);
      bitmap.close();
      for (const canvas of slices) {
        const recognized = await worker.recognize(canvas);
        if (recognized.data.text) parts.push(recognized.data.text);
        if (hasMeasures(readDrawing(parts.join('\n')))) return parts.join('\n');
      }
    }
    return parts.join('\n');
  } finally {
    await worker.terminate();
  }
}

export async function readImageText(images: Uint8Array[]) {
  if (!images.length || typeof createImageBitmap !== 'function') return '';
  const bitmaps: ImageBitmap[] = [];
  for (const bytes of images) {
    bitmaps.push(await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/jpeg' })));
  }
  return textFromBitmaps(bitmaps);
}

/** A photo or scan of a drawing, rather than a PDF. */
export async function readDrawingImage(file: Blob) {
  if (typeof createImageBitmap !== 'function') return '';
  const bitmap = await limitBitmap(await createImageBitmap(file));
  return textFromBitmaps([bitmap]);
}
