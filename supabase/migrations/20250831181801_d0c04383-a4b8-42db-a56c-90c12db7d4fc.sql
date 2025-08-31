-- Update RLS policies for organizations to allow all authenticated users to view
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

CREATE POLICY "All authenticated users can view organizations" 
ON public.organizations 
FOR SELECT 
TO authenticated
USING (true);

-- Update insert policy to require superadmin
DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;

CREATE POLICY "Superadmins can insert organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Update update policy to require superadmin
DROP POLICY IF EXISTS "Users can update their organizations" ON public.organizations;

CREATE POLICY "Superadmins can update organizations" 
ON public.organizations 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Update RLS policies for user_organizations to allow all authenticated users to view members
DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.user_organizations;

CREATE POLICY "All authenticated users can view organization memberships" 
ON public.user_organizations 
FOR SELECT 
TO authenticated
USING (true);

-- Update insert policy to require superadmin
DROP POLICY IF EXISTS "Users can insert their own organization memberships" ON public.user_organizations;

CREATE POLICY "Superadmins can insert organization memberships" 
ON public.user_organizations 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Add update and delete policies for superadmins
CREATE POLICY "Superadmins can update organization memberships" 
ON public.user_organizations 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete organization memberships" 
ON public.user_organizations 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role));