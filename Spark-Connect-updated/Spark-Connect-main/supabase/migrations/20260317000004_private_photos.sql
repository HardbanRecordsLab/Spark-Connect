-- ── private_photos ────────────────────────────────────────────
-- Stores URLs of a user's private photos (separate from public profile photos)
CREATE TABLE IF NOT EXISTS public.private_photos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS private_photos_user_idx ON public.private_photos(user_id);

ALTER TABLE public.private_photos ENABLE ROW LEVEL SECURITY;

-- Owner can manage own photos
CREATE POLICY "Users manage own private photos"
  ON public.private_photos FOR ALL
  USING (auth.uid() = user_id);

-- Granted users can view
CREATE POLICY "Granted users can view private photos"
  ON public.private_photos FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.private_photo_requests
      WHERE requester_id = auth.uid()
        AND owner_id = user_id
        AND status = 'granted'
    )
  );

-- ── private_photo_requests ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.private_photo_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, owner_id)
);

CREATE INDEX IF NOT EXISTS ppr_owner_idx ON public.private_photo_requests(owner_id, status);
CREATE INDEX IF NOT EXISTS ppr_requester_idx ON public.private_photo_requests(requester_id);

ALTER TABLE public.private_photo_requests ENABLE ROW LEVEL SECURITY;

-- Requester can insert and view their own requests
CREATE POLICY "Requesters manage own requests"
  ON public.private_photo_requests FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- ── private-photos Storage Bucket ─────────────────────────────
-- Create via Supabase Dashboard → Storage → New Bucket:
--   Name: private-photos
--   Public: NO (private)
--   File size limit: 10 MB
--
-- Then add this RLS policy on the bucket:
--   Allow SELECT for authenticated users who have 'granted' status in private_photo_requests
--   (handled at application level — bucket URLs are not guessable)
