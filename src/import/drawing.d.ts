export type DrawingRoof = 'pulpettak' | 'sadeltak' | 'flackt';
export type DrawingCovering = 'felt' | 'metal' | 'tiles' | 'shingles';
export type DrawingDoor = 'STEHAG' | 'SVANSHALL';
export type DrawingWindow = 'standard-single' | 'panorama' | 'sprojat' | 'frost';

export interface DrawingReading {
  width: number | null;
  depth: number | null;
  height: number | null;
  roof: DrawingRoof | null;
  covering: DrawingCovering | null;
  door: DrawingDoor | null;
  window: DrawingWindow | null;
}

export function readDrawing(text: string): DrawingReading;

export function hasMeasures(reading: DrawingReading): boolean;

export function extractPdfText(data: Uint8Array | ArrayBuffer): Promise<string>;
