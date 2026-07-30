-- ═══════════════════════════════════════════════════════════════
-- Real swipe -> match creation
--
-- Problem: the core "like a profile" action across the whole app was
-- a no-op. DiscoverPage's "Dopasuj" button only closed the preview
-- modal (setSelectedProfile(null)) -- it never inserted a row into
-- `swipes`, and nothing anywhere ever created a `matches` row from
-- reciprocal likes. This is the fundamental loop of a dating app and
-- it did not exist.
--
-- swipes.SELECT RLS only allows seeing your own swipes (by design --
-- you shouldn't be able to query whether someone liked you before
-- they match with you), so checking "did they already like me too"
-- has to happen server-side in a SECURITY DEFINER function, not via
-- a client-side SELECT.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.record_swipe(p_swiped_id uuid, p_direction text)
RETURNS TABLE(matched boolean, match_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_swiper uuid := auth.uid();
  v_reciprocal boolean;
  v_match_id uuid;
BEGIN
  IF v_swiper IS NULL THEN
    RAISE EXCEPTION 'Musisz być zalogowany/a';
  END IF;
  IF p_direction NOT IN ('left', 'right', 'super') THEN
    RAISE EXCEPTION 'Nieprawidłowy kierunek';
  END IF;
  IF p_swiped_id = v_swiper THEN
    RAISE EXCEPTION 'Nie możesz polubić własnego profilu';
  END IF;

  INSERT INTO public.swipes (swiper_id, swiped_id, direction, is_super)
  VALUES (v_swiper, p_swiped_id, p_direction, p_direction = 'super')
  ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET direction = EXCLUDED.direction, is_super = EXCLUDED.is_super;

  IF p_direction = 'left' THEN
    RETURN QUERY SELECT false, NULL::uuid;
    RETURN;
  END IF;

  -- Did the other person already like (or super-like) me?
  SELECT EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swiper_id = p_swiped_id AND swiped_id = v_swiper AND direction IN ('right', 'super')
  ) INTO v_reciprocal;

  IF NOT v_reciprocal THEN
    RETURN QUERY SELECT false, NULL::uuid;
    RETURN;
  END IF;

  -- Canonical ordering so (A,B) and (B,A) never both get inserted.
  INSERT INTO public.matches (user1_id, user2_id)
  VALUES (LEAST(v_swiper, p_swiped_id), GREATEST(v_swiper, p_swiped_id))
  ON CONFLICT (user1_id, user2_id) DO NOTHING
  RETURNING id INTO v_match_id;

  IF v_match_id IS NULL THEN
    SELECT id INTO v_match_id FROM public.matches
    WHERE user1_id = LEAST(v_swiper, p_swiped_id) AND user2_id = GREATEST(v_swiper, p_swiped_id);
  END IF;

  RETURN QUERY SELECT true, v_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_swipe(uuid, text) TO authenticated;
