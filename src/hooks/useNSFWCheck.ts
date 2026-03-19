// useNSFWCheck — client-side NSFW detection using nsfwjs
// Falls back to "safe" if model fails to load (don't block users on errors)
// In production: swap with server-side AWS Rekognition / Google Vision for better accuracy

import { useRef, useCallback } from 'react';

type NSFWResult = 'safe' | 'unsafe' | 'uncertain' | 'error';

interface NSFWCheck {
  result: NSFWResult;
  reason?: string;
}

// Simple heuristic check using canvas pixel analysis (no external model needed)
// In production replace with actual nsfwjs: https://github.com/infinitered/nsfwjs
async function checkImageURL(url: string): Promise<NSFWCheck> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64; // small sample for speed
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve({ result: 'error' }); return; }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Skin tone detection heuristic — count pixels in skin tone range
        let skinPixels = 0;
        const total = size * size;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // Skin tone: R > 95, G > 40, B > 20, R > G, R > B, |R-G| > 15
          if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
            skinPixels++;
          }
        }
        const skinRatio = skinPixels / total;

        // Very high skin ratio might indicate nudity — flag for human review
        if (skinRatio > 0.6) {
          resolve({ result: 'uncertain', reason: `Wysoki udział odcieni skóry (${Math.round(skinRatio * 100)}%) — wymaga moderacji` });
        } else {
          resolve({ result: 'safe' });
        }
      } catch {
        resolve({ result: 'error' });
      }
    };
    img.onerror = () => resolve({ result: 'error' });
    img.src = url;
    // Timeout after 3s
    setTimeout(() => resolve({ result: 'error' }), 3000);
  });
}

export function useNSFWCheck() {
  const checkingRef = useRef(false);

  const checkFile = useCallback(async (file: File): Promise<NSFWCheck> => {
    if (checkingRef.current) return { result: 'safe' };
    checkingRef.current = true;

    try {
      // Validate file type first
      if (!file.type.startsWith('image/')) {
        return { result: 'error', reason: 'Nieprawidłowy typ pliku' };
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return { result: 'unsafe', reason: 'Plik jest za duży (max 10 MB)' };
      }

      const url = URL.createObjectURL(file);
      const result = await checkImageURL(url);
      URL.revokeObjectURL(url);
      return result;
    } catch {
      return { result: 'error' };
    } finally {
      checkingRef.current = false;
    }
  }, []);

  return { checkFile };
}
