
-- Create reactions table for emoji reactions on messages
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on messages in their conversations
CREATE POLICY "Users can view reactions"
ON public.reactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    JOIN public.matches mt ON mt.id = c.match_id
    WHERE m.id = reactions.message_id
      AND (mt.user1_id = auth.uid() OR mt.user2_id = auth.uid())
  )
);

-- Users can add reactions
CREATE POLICY "Users can add reactions"
ON public.reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;

-- Index for fast reaction lookup
CREATE INDEX idx_reactions_message_id ON public.reactions(message_id);
