/**
 * QR Code generation for MoodBoard share links.
 */
import QRCode from 'qrcode';

export interface QrOptions {
  margin?: number;
  width?: number;
  darkColor?: string;
  lightColor?: string;
}

export async function generateQrSvg(text: string, options?: QrOptions): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: options?.margin ?? 2,
    width: options?.width ?? 240,
    color: {
      dark: options?.darkColor ?? '#173D35',
      light: options?.lightColor ?? '#FFFFFF'
    }
  });
}

export async function generateQrDataUrl(text: string, options?: QrOptions): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: options?.margin ?? 2,
    width: options?.width ?? 280,
    color: {
      dark: options?.darkColor ?? '#173D35',
      light: options?.lightColor ?? '#FFFFFF'
    }
  });
}
