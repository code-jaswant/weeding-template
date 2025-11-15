-- This script sets the first user who signs up as admin
-- Run this ONCE after creating your first account
-- Replace 'your-email@example.com' with your actual email address

UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com' 
AND is_admin = false;

SELECT 'Admin status updated for user:' as message, email, is_admin FROM public.profiles WHERE email = 'your-email@example.com';
