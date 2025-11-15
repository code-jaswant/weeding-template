-- Demo Admin User Setup Script
-- This script creates a demo admin user in your Supabase project
-- NOTE: You must first manually create the user through the Supabase dashboard or auth UI

-- Once the user exists in auth.users, run this to make them admin:
-- Demo credentials:
-- Email: demo@wedding-templates.com
-- Password: DemoAdmin123!

-- Update the demo user profile to be an admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'demo@wedding-templates.com';

-- Verify the admin was created
SELECT id, email, is_admin FROM public.profiles WHERE email = 'demo@wedding-templates.com';
