CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  author text NOT NULL DEFAULT 'Zespół Spark Connect',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone (including logged-out visitors) can read published posts.
CREATE POLICY "public_can_read_published_posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Admins can read everything, including unpublished drafts.
CREATE POLICY "admins_can_read_all_posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "admins_can_insert_posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "admins_can_update_posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "admins_can_delete_posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.is_admin_user(auth.uid()));

CREATE INDEX blog_posts_published_created_idx ON public.blog_posts (published, created_at DESC);
