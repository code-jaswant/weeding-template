-- Add INSERT policy for qr_codes table
-- Users can insert QR codes for order items that belong to their orders
CREATE POLICY "Users can insert QR codes for their orders" ON public.qr_codes FOR INSERT WITH CHECK (
  order_item_id IN (
    SELECT id FROM public.order_items
    WHERE order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  )
);

-- Admins can also insert QR codes
CREATE POLICY "Admins can insert QR codes" ON public.qr_codes FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);

