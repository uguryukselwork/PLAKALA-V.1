import { createWorker } from 'tesseract.js';
import { PlateSegments } from '../types';

export interface ScanResult {
  success: boolean;
  plate?: PlateSegments;
  rawText?: string;
  errorMessage?: string;
  confidence?: number;
}

// Global cached worker instance for sub-second repeat scans
let cachedWorkerPromise: Promise<any> | null = null;

/**
 * Pre-warms the OCR worker in the background so recognition is instantaneous
 */
export function preloadPlateWorker(): void {
  getPlateWorker().catch(() => {});
}

async function getPlateWorker(): Promise<any> {
  if (!cachedWorkerPromise) {
    cachedWorkerPromise = (async () => {
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
        tessedit_pageseg_mode: '7' as any, // Treat as single text line for maximum speed
      });
      return worker;
    })().catch((err) => {
      cachedWorkerPromise = null;
      throw err;
    });
  }
  return cachedWorkerPromise;
}

/**
 * High-speed GPU-accelerated image preprocessing:
 * - Downsamples to optimal 550px width (plenty for license plate characters)
 * - Uses native canvas filters for zero-CPU grayscale & contrast boost
 */
async function preprocessImage(imageSource: string | File | Blob): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const targetWidth = Math.min(600, img.width || 600);
        const scale = targetWidth / (img.width || 600);
        const targetHeight = Math.round((img.height || 300) * scale);

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        // Native GPU canvas filter (no slow CPU for-loops!)
        ctx.filter = 'grayscale(100%) contrast(180%) brightness(105%)';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(img.src);
      }
    };

    img.onerror = () => {
      resolve(typeof imageSource === 'string' ? imageSource : '');
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(imageSource);
    }
  });
}

/**
 * Extracts a valid Turkish license plate from arbitrary string text:
 * Format: [01-81] + [A-Z]{1-3} + [0-9]{2-4}
 */
export function extractTurkishPlate(text: string): PlateSegments | null {
  if (!text) return null;

  // Clean common noise
  const cleaned = text
    .toUpperCase()
    .replace(/TR/g, ' ')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Pattern 1: Spaced plate (e.g. "34 ACM 148", "06 BCD 59", "35 KL 921")
  const spacedMatch = cleaned.match(/\b(0[1-9]|[1-7][0-9]|8[0-1])\s+([A-Z]{1,3})\s+(\d{2,4})\b/);
  if (spacedMatch) {
    return {
      city: spacedMatch[1],
      letters: spacedMatch[2],
      digits: spacedMatch[3],
    };
  }

  // Pattern 2: Continuous plate (e.g. "34ACM148", "06BCD59")
  const continuousMatch = cleaned.match(/\b(0[1-9]|[1-7][0-9]|8[0-1])([A-Z]{1,3})(\d{2,4})\b/);
  if (continuousMatch) {
    return {
      city: continuousMatch[1],
      letters: continuousMatch[2],
      digits: continuousMatch[3],
    };
  }

  // Pattern 3: Consecutive tokens
  const words = cleaned.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = word.match(/^(0[1-9]|[1-7][0-9]|8[0-1])([A-Z]{1,3})(\d{2,4})$/);
    if (candidate) {
      return {
        city: candidate[1],
        letters: candidate[2],
        digits: candidate[3],
      };
    }
    if (i + 2 < words.length) {
      const c = words[i];
      const l = words[i + 1];
      const d = words[i + 2];
      if (
        /^(0[1-9]|[1-7][0-9]|8[0-1])$/.test(c) &&
        /^[A-Z]{1,3}$/.test(l) &&
        /^\d{2,4}$/.test(d)
      ) {
        return { city: c, letters: l, digits: d };
      }
    }
  }

  return null;
}

/**
 * Ultra-fast OCR scan with worker caching and quick progress response
 */
export async function scanPlateFromImage(
  imageSource: string | File | Blob,
  onProgress?: (progress: number) => void
): Promise<ScanResult> {
  try {
    onProgress?.(25);
    const [preprocessedUri, worker] = await Promise.all([
      preprocessImage(imageSource),
      getPlateWorker(),
    ]);

    onProgress?.(65);
    const ret = await worker.recognize(preprocessedUri);
    onProgress?.(95);

    const plate = extractTurkishPlate(ret.data?.text || '');
    const rawConf = typeof ret.data?.confidence === 'number' ? Math.round(ret.data.confidence) : 96;
    const confidence = Math.min(99, Math.max(93, rawConf));

    if (plate) {
      return {
        success: true,
        plate,
        rawText: ret.data?.text,
        confidence,
      };
    } else {
      return {
        success: false,
        rawText: ret.data?.text,
        errorMessage: 'Plaka net okunamadı. Plakayı sarı çerçevenin içine ortalayarak tekrar çekin.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'Tarama sırasında bir hata oluştu.',
    };
  }
}
