
-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('chat-media', 'chat-media', true, 52428800, ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- RLS for chat-media bucket: authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view chat media (public bucket)
CREATE POLICY "Chat media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- Users can delete their own uploads
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime on messages and conversations tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Add UPDATE policy for messages (mark as read)
CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE c.id = messages.conversation_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE c.id = messages.conversation_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

-- Add INSERT policy for conversations
CREATE POLICY "Users can create conversations for their matches"
ON public.conversations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches m
    WHERE m.id = match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);
