DROP POLICY IF EXISTS "Authenticated users can insert lunch menu" ON public.lunch_menu;
DROP POLICY IF EXISTS "Authenticated users can update lunch menu" ON public.lunch_menu;
DROP POLICY IF EXISTS "Authenticated users can delete lunch menu" ON public.lunch_menu;

CREATE POLICY "Admins can insert lunch menu"
ON public.lunch_menu FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE POLICY "Admins can update lunch menu"
ON public.lunch_menu FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

CREATE POLICY "Admins can delete lunch menu"
ON public.lunch_menu FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));