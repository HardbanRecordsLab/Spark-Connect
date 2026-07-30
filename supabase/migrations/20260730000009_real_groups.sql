-- ═══════════════════════════════════════════════════════════════
-- Real discussion groups
--
-- Problem: GroupsPage was entirely hardcoded mock data (8 groups in
-- a JS array), "join" was local useState that reset on refresh, and
-- clicking a group called onOpenGroupChat={() => {}} in AppLayout --
-- a complete no-op. There was no groups table, no membership, no
-- group chat at all. This adds a real minimal version: groups,
-- membership, and a basic realtime text/image group chat.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '💬',
  category TEXT DEFAULT 'Lifestyle',
  banner_style TEXT,
  is_live BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name)
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Groups are publicly readable" ON public.groups;
CREATE POLICY "Groups are publicly readable"
  ON public.groups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
CREATE POLICY "Admins can manage groups"
  ON public.groups FOR ALL TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Readable by any authenticated user -- needed for member counts and
-- "am I a member" checks without a service-role round trip. No
-- sensitive data beyond "user X is in group Y", same exposure level
-- as a public member list on most group-chat products.
DROP POLICY IF EXISTS "Group membership is readable" ON public.group_members;
CREATE POLICY "Group membership is readable"
  ON public.group_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS group_messages_group_idx ON public.group_messages(group_id, created_at);

DROP POLICY IF EXISTS "Members can read group messages" ON public.group_messages;
CREATE POLICY "Members can read group messages"
  ON public.group_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_messages.group_id AND m.user_id = auth.uid()));

DROP POLICY IF EXISTS "Members can send group messages" ON public.group_messages;
CREATE POLICY "Members can send group messages"
  ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = group_messages.group_id AND m.user_id = auth.uid())
  );

-- Seed with the same 8 groups the mock UI already showed, so the
-- feature doesn't regress to an empty list on launch.
INSERT INTO public.groups (name, description, emoji, category, banner_style, is_live, created_at) VALUES
  ('Jazz & Vinyl ♫', 'Dla miłośników muzyki analogowej. Rekomendacje, nowości, spotkania w mieście.', '🎷', 'Muzyka', 'linear-gradient(135deg,#0d0820,#1a0d35)', true, now()),
  ('Kawa i filozofia ☕', 'Poranne myśli, wielkie pytania. Codziennie nowy temat do dyskusji przy filiżance.', '☕', 'Lifestyle', 'linear-gradient(135deg,#0a0a00,#1a1800)', false, now()),
  ('Kino Niezależne 🎬', 'Arthouse, festiwale, recenzje. Dla tych którzy kochają film jako sztukę.', '🎬', 'Film', 'linear-gradient(135deg,#0a0512,#15082a)', false, now()),
  ('Bieganie Warszawa 🏃', 'Wspólne treningi w Parku Łazienkowskim i Polu Mokotowskim. Każdy poziom.', '🏃', 'Sport', 'linear-gradient(135deg,#001a08,#003018)', false, now()),
  ('Wino & Sery 🍷', 'Degustacje, rekomendacje, spotkania. Raz w miesiącu wspólne wieczory.', '🍷', 'Food', 'linear-gradient(135deg,#1a0008,#2a0012)', false, now()),
  ('Debata & Kultura 📚', 'Tygodniowe debaty na tematy kulturalne, społeczne i filozoficzne.', '📚', 'Kultura', 'linear-gradient(135deg,#0a0a18,#18183a)', true, now()),
  ('Nocne Marki 🌙', 'Dla sów. Rozmowy po północy, muzyka, dzielenie się przeżyciami dnia.', '🌙', 'Lifestyle', 'linear-gradient(135deg,#050510,#0d0d2a)', false, now()),
  ('Fotografia Uliczna 📸', 'Sesje w mieście, krytyki zdjęć, inspiration. Wszyscy poziomy.', '📸', 'Kultura', 'linear-gradient(135deg,#101010,#1a1a1a)', false, now())
ON CONFLICT (name) DO NOTHING;
