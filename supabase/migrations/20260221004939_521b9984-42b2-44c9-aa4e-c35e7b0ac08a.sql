ALTER TABLE public.tasks ADD COLUMN recurrence text DEFAULT NULL;
-- Values: 'daily', 'weekly', 'monthly', or NULL (no recurrence)