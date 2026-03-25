-- ── System Bezpieczeństwa: Blacklista i Anty-Bot ──────────────

-- 0. Upewnij się, że typy i tabele ról istnieją (jeśli nie zostały utworzone wcześniej)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role DEFAULT 'user' NOT NULL,
  UNIQUE(user_id, role)
);

-- 1. Tabela Czarnej Listy (Blacklist)
CREATE TABLE IF NOT EXISTS public.blacklist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type text NOT NULL CHECK (target_type IN ('email', 'user_id', 'ip')),
    target_value text NOT NULL,
    reason text,
    banned_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    UNIQUE(target_type, target_value)
);

-- RLS dla blacklist
ALTER TABLE public.blacklist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage blacklist') THEN
    CREATE POLICY "Admins can manage blacklist" ON public.blacklist
        USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 2. Rozszerzenie tabeli profiles o wskaźnik bota
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bot_score float DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_timestamp timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_bot_blocked boolean DEFAULT false;

-- 3. Funkcja do sprawdzania czy użytkownik jest na czarnej liście
CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blacklist 
    WHERE (target_type = 'user_id' AND target_value = auth.uid()::text)
       OR (target_type = 'email' AND target_value = (SELECT email FROM auth.users WHERE id = auth.uid()))
       -- IP checking would require a more complex setup with custom claims or headers
  );
END;
$$;

-- 4. Trigger do blokowania botów na podstawie zbyt szybkiej aktywności (prosty Rate Limiter)
CREATE OR REPLACE FUNCTION public.check_bot_activity()
RETURNS TRIGGER AS $$
DECLARE
    last_act timestamptz;
    diff interval;
BEGIN
    SELECT last_activity_timestamp INTO last_act FROM public.profiles WHERE id = auth.uid();
    diff := now() - last_act;
    
    -- Jeśli aktywność częstsza niż 500ms, zwiększ bot_score
    IF diff < interval '500 milliseconds' THEN
        UPDATE public.profiles SET bot_score = bot_score + 0.1 WHERE id = auth.uid();
    ELSE
        UPDATE public.profiles SET bot_score = GREATEST(0, bot_score - 0.01) WHERE id = auth.uid();
    END IF;
    
    -- Automatyczna blokada powyżej pewnego progu
    IF (SELECT bot_score FROM public.profiles WHERE id = auth.uid()) > 5.0 THEN
        UPDATE public.profiles SET is_bot_blocked = true WHERE id = auth.uid();
        RAISE EXCEPTION 'Detected automated activity. Access denied.';
    END IF;

    UPDATE public.profiles SET last_activity_timestamp = now() WHERE id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
