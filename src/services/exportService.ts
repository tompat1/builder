/**
 * Export Pipeline Service
 * Generates 2D Blueprints, Walkthrough videos, and high-resolution renders.
 */

export function exportRenderedImage(canvas: HTMLCanvasElement, filename = 'house-render.png'): void {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportBlueprintSvg(dimensions: { width: number; depth: number; height: number }): Promise<string> {
  // 2D schematic generator
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
      <rect width="800" height="600" fill="#ffffff" />
      <rect x="100" y="100" width="600" height="400" fill="none" stroke="#111827" stroke-width="4" />
      <text x="120" y="80" font-family="monospace" font-size="14" fill="#374151">
        Bredd: ${dimensions.width} mm | Djup: ${dimensions.depth} mm
      </text>
    </svg>
  `;
  return svg.trim();
}

export function startWalkthroughRecording(canvas: HTMLCanvasElement, durationMs = 5000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };

    mediaRecorder.onerror = (err) => reject(err);
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), durationMs);
  });
}
