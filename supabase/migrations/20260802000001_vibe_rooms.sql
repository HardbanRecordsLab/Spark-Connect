CREATE TABLE public.vibe_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Chill & Talk',
  is_private boolean NOT NULL DEFAULT false,
  max_participants integer NOT NULL DEFAULT 4 CHECK (max_participants BETWEEN 2 AND 8),
  current_participants integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE public.vibe_room_participants (
  room_id uuid NOT NULL REFERENCES public.vibe_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_muted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.vibe_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_room_participants ENABLE ROW LEVEL SECURITY;

-- Private rooms are only visible to the host and to people who already
-- joined (via join_vibe_room, which is reachable by room id alone --
-- e.g. a link shared in chat -- without needing to see it listed first).
CREATE POLICY "authenticated_can_read_visible_rooms" ON public.vibe_rooms
  FOR SELECT TO authenticated
  USING (
    is_active
    AND (
      NOT is_private
      OR host_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.vibe_room_participants vrp WHERE vrp.room_id = vibe_rooms.id AND vrp.user_id = auth.uid())
    )
  );

-- Only "own row" -- NOT "host can see all participants of their room",
-- since that would need an EXISTS back into vibe_rooms, and vibe_rooms'
-- own SELECT policy already EXISTS's into this table for the private-room
-- check. Two tables each querying the other inside RLS is infinite
-- recursion (Postgres error 42P17) -- learned the hard way once already.
-- The live participant roster is LiveKit's job anyway (see ActiveRoom).
CREATE POLICY "users_can_read_own_participant_rows" ON public.vibe_room_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- All writes go through the SECURITY DEFINER RPCs below (capacity checks,
-- host-leaves-ends-room logic) -- no direct INSERT/UPDATE/DELETE policies
-- needed for authenticated on either table.

CREATE INDEX vibe_rooms_active_idx ON public.vibe_rooms (is_active, created_at DESC);
CREATE INDEX vibe_room_participants_room_idx ON public.vibe_room_participants (room_id);

CREATE OR REPLACE FUNCTION public.handle_vibe_room_participant_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vibe_rooms SET current_participants = current_participants + 1 WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vibe_rooms SET current_participants = GREATEST(0, current_participants - 1) WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER tr_vibe_room_participant_change
AFTER INSERT OR DELETE ON public.vibe_room_participants
FOR EACH ROW EXECUTE FUNCTION public.handle_vibe_room_participant_change();

CREATE OR REPLACE FUNCTION public.create_vibe_room(p_name text, p_category text, p_is_private boolean, p_max_participants integer DEFAULT 4)
RETURNS public.vibe_rooms
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_room public.vibe_rooms;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN RAISE EXCEPTION 'Room name required'; END IF;
  IF p_max_participants < 2 OR p_max_participants > 8 THEN RAISE EXCEPTION 'max_participants must be between 2 and 8'; END IF;

  INSERT INTO public.vibe_rooms (host_id, name, category, is_private, max_participants)
  VALUES (auth.uid(), trim(p_name), coalesce(p_category, 'Chill & Talk'), coalesce(p_is_private, false), p_max_participants)
  RETURNING * INTO v_room;

  INSERT INTO public.vibe_room_participants (room_id, user_id) VALUES (v_room.id, auth.uid());

  SELECT * INTO v_room FROM public.vibe_rooms WHERE id = v_room.id;
  RETURN v_room;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_vibe_room(text, text, boolean, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_vibe_room(p_room_id uuid)
RETURNS public.vibe_rooms
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_room public.vibe_rooms;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_room FROM public.vibe_rooms WHERE id = p_room_id AND is_active FOR UPDATE;
  IF v_room.id IS NULL THEN RAISE EXCEPTION 'room_not_found'; END IF;

  IF EXISTS (SELECT 1 FROM public.vibe_room_participants WHERE room_id = p_room_id AND user_id = auth.uid()) THEN
    RETURN v_room;
  END IF;

  IF v_room.current_participants >= v_room.max_participants THEN
    RAISE EXCEPTION 'room_full';
  END IF;

  INSERT INTO public.vibe_room_participants (room_id, user_id) VALUES (p_room_id, auth.uid());

  SELECT * INTO v_room FROM public.vibe_rooms WHERE id = p_room_id;
  RETURN v_room;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_vibe_room(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_vibe_room(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_host uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT host_id INTO v_host FROM public.vibe_rooms WHERE id = p_room_id FOR UPDATE;

  DELETE FROM public.vibe_room_participants WHERE room_id = p_room_id AND user_id = auth.uid();

  IF v_host = auth.uid() THEN
    UPDATE public.vibe_rooms SET is_active = false, ended_at = now() WHERE id = p_room_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.leave_vibe_room(uuid) TO authenticated;
