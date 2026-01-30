-- Run this command in your Supabase SQL Editor to enable the reply feature.

ALTER TABLE public.secret_chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.secret_chat_messages(id);

-- Optional: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_secret_chat_messages_reply_to_id ON public.secret_chat_messages(reply_to_id);
