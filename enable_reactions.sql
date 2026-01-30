-- Run this command in your Supabase SQL Editor to enable message reactions.

ALTER TABLE public.secret_chat_messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Example structure:
-- {
--   "👍": ["user_id_1", "user_id_2"],
--   "❤️": ["user_id_3"]
-- }
