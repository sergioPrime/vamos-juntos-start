-- Allow authenticated users to create organizations and associate themselves as members

-- Organizations: allow INSERT for authenticated users
CREATE POLICY "Users can insert organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- User organizations: allow INSERT only for the current user id
CREATE POLICY "Users can insert their own organization memberships"
ON public.user_organizations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
