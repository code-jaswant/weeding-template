-- Verify and fix admin orders viewing policy
-- This ensures admins can view all orders and their nested relationships

-- First, ensure the old policy is dropped (in case script 002 wasn't run)
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Recreate the admin orders policy using the is_admin function
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Also ensure order_items policy allows admins to view all
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Verify the is_admin function exists
-- (This should already exist from script 002, but we'll check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
    RETURNS BOOLEAN AS $$
      SELECT COALESCE(
        (SELECT is_admin FROM public.profiles WHERE id = user_id LIMIT 1),
        FALSE
      );
    $$ LANGUAGE SQL SECURITY DEFINER;
  END IF;
END $$;

