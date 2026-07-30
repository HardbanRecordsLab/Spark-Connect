-- record_swipe() (previous migration) relies on
-- ON CONFLICT (user1_id, user2_id) DO NOTHING to avoid creating a
-- duplicate match row when both sides' swipes are processed. Testing
-- that migration against production caught that public.matches has
-- no unique constraint on that pair at all -- only a primary key on
-- id -- despite the original 20260308 migration's CREATE TABLE
-- listing UNIQUE (user1_id, user2_id) inline; it evidently never
-- applied to this table in production. Table is empty, so this is
-- safe to add directly.
ALTER TABLE public.matches
  ADD CONSTRAINT matches_user_pair_unique UNIQUE (user1_id, user2_id);
