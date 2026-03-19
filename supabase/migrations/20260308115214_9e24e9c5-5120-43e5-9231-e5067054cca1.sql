
-- Add reply_to_id column to messages for swipe-to-reply
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- Index for fast lookup of replies
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id);
