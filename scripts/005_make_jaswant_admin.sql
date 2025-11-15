-- Update jaswant@gmail.com to admin status
UPDATE public.profiles
SET is_admin = true, updated_at = NOW()
WHERE email = 'jaswant@gmail.com';
