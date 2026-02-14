
-- Add email column to profiles for username-based login lookup
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Update trigger to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, discord_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'discord_id'
  );
  RETURN NEW;
END;
$$;
