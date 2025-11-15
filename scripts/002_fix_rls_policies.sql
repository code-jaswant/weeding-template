-- Drop problematic policies causing infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.templates;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Admins can view all downloads" ON public.downloads;

-- Create is_admin function to avoid recursive queries
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id LIMIT 1),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Recreate policies using the function instead of subqueries
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Templates RLS Policies (fixed)
CREATE POLICY "Admins can view all templates" ON public.templates FOR SELECT USING (
  public.is_admin(auth.uid())
);
CREATE POLICY "Admins can insert templates" ON public.templates FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);
CREATE POLICY "Admins can update templates" ON public.templates FOR UPDATE USING (
  public.is_admin(auth.uid())
);
CREATE POLICY "Admins can delete templates" ON public.templates FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- Orders RLS Policies (fixed)
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Order Items RLS Policies (fixed)
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- QR Codes RLS Policies (fixed)
CREATE POLICY "Admins can view all QR codes" ON public.qr_codes FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- Downloads RLS Policies (fixed)
CREATE POLICY "Admins can view all downloads" ON public.downloads FOR SELECT USING (
  public.is_admin(auth.uid())
);
