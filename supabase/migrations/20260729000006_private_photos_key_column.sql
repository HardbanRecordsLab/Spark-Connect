-- ═══════════════════════════════════════════════════════════════
-- private_photos was missing the `key` column that both the upload
-- code (PrivatePhotos.tsx) and the get-private-photo-url Edge
-- Function already assumed existed — uploads stored an empty `url`
-- and the "verified" photo_id lookup path in the Edge Function was
-- silently broken (selecting a non-existent column). This is what
-- forced every real caller onto the key-only path, which had no
-- access-grant check at all. See accompanying Edge Function fix.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.private_photos
  ADD COLUMN IF NOT EXISTS key text;

CREATE UNIQUE INDEX IF NOT EXISTS private_photos_key_idx ON public.private_photos(key);
