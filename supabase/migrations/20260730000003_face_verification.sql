-- ═══════════════════════════════════════════════════════════════
-- Real face verification: a submitted selfie queued for admin
-- review, replacing the previous FaceVerify flow which had no camera
-- access at all and always reported instant success.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_key   text NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  reject_reason text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_requests_status_idx ON public.verification_requests(status, created_at);
CREATE INDEX IF NOT EXISTS verification_requests_user_idx ON public.verification_requests(user_id);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_user(auth.uid()));

CREATE POLICY "Users submit own verification request"
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Reviewing (approve/reject) only happens through the RPC below, which
-- runs as service context — no client-side UPDATE policy needed here.

-- One atomic action: mark the request reviewed AND (if approved) flip
-- profiles.is_verified — avoids a client doing two separate writes
-- where one could succeed without the other.
CREATE OR REPLACE FUNCTION public.admin_review_verification(p_request_id uuid, p_approve boolean, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  SELECT user_id INTO v_user_id FROM public.verification_requests WHERE id = p_request_id AND status = 'pending';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already reviewed';
  END IF;

  UPDATE public.verification_requests
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reject_reason = CASE WHEN p_approve THEN NULL ELSE p_reason END
  WHERE id = p_request_id;

  IF p_approve THEN
    PERFORM set_config('app.trusted_profile_write', 'on', true);
    UPDATE public.profiles SET is_verified = true WHERE id = v_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_verification(uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_verification(uuid, boolean, text) TO authenticated;
