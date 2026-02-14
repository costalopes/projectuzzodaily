
CREATE TABLE public.diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diary entries"
ON public.diary_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diary entries"
ON public.diary_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
ON public.diary_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
ON public.diary_entries FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_diary_entries_user_date ON public.diary_entries(user_id, entry_date);
