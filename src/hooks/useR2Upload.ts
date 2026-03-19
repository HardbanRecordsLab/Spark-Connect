// useR2Upload — wszystkie uploady plików przez Cloudflare R2
// Używa Supabase Edge Function generate-upload-url do generowania
// presigned URL po stronie serwera (klucze R2 nigdy nie trafiają do przeglądarki).

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type R2Bucket = 'avatars' | 'chat-media' | 'private';

interface UploadResult {
  publicUrl: string;   // URL do zapisania w DB (null dla private bucket)
  key: string;         // R2 object key
}

interface UploadOptions {
  bucket: R2Bucket;
  file: File | Blob;
  filename?: string;           // opcjonalna nazwa — domyślnie file.name lub 'blob'
  onProgress?: (pct: number) => void;
}

// Zbuduj URL do Edge Function (działa lokalnie i w produkcji)
function getFunctionUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/functions/v1/generate-upload-url`;
}

export function useR2Upload() {
  const upload = useCallback(async (opts: UploadOptions): Promise<UploadResult> => {
    const { bucket, file, filename, onProgress } = opts;

    // 1. Pobierz sesję (token do autoryzacji Edge Function)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Musisz być zalogowany/a aby przesłać plik');

    const name = filename ?? (file instanceof File ? file.name : 'blob');
    const contentType = file instanceof File ? file.type : 'application/octet-stream';

    // 2. Poproś Edge Function o presigned URL
    onProgress?.(5);
    const res = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bucket, filename: name, contentType }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Błąd serwera' }));
      throw new Error(err.error ?? 'Nie udało się wygenerować URL uploadu');
    }

    const { presignedUrl, publicUrl, key, maxBytes } = await res.json() as {
      presignedUrl: string;
      publicUrl: string | null;
      key: string;
      maxBytes: number;
    };

    // 3. Sprawdź rozmiar pliku
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / (1024 * 1024));
      throw new Error(`Plik jest za duży. Maksymalny rozmiar: ${mb} MB`);
    }

    // 4. Uploaduj plik bezpośrednio do R2 przez presigned URL
    onProgress?.(15);

    // Używamy XMLHttpRequest zamiast fetch dla progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round(15 + (e.loaded / e.total) * 80);
          onProgress?.(pct);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload do R2 nie powiódł się: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Błąd sieci podczas uploadu')));
      xhr.addEventListener('abort', () => reject(new Error('Upload anulowany')));

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(file);
    });

    onProgress?.(100);

    if (!publicUrl && bucket !== 'private') {
      throw new Error('Brak publicznego URL po uploadzie');
    }

    return { publicUrl: publicUrl ?? '', key };
  }, []);

  return { upload };
}

// ── Helper: pobierz signed URL dla prywatnego zdjęcia ─────────────────────────
export async function getPrivatePhotoUrl(key: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Brak sesji');

  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const res = await fetch(`${base}/functions/v1/get-private-photo-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ key }),
  });

  if (!res.ok) throw new Error('Brak dostępu do zdjęcia');
  const { signedUrl } = await res.json() as { signedUrl: string };
  return signedUrl;
}
