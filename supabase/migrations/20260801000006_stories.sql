CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE TABLE public.story_views (
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read_active_or_own_stories" ON public.stories
  FOR SELECT TO authenticated
  USING (expires_at > now() OR user_id = auth.uid());

CREATE POLICY "users_can_insert_own_stories" ON public.stories
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_stories" ON public.stories
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "authenticated_can_read_story_views" ON public.story_views
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_can_record_own_story_views" ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

CREATE INDEX stories_user_expires_idx ON public.stories (user_id, expires_at DESC);
CREATE INDEX story_views_story_idx ON public.story_views (story_id);
