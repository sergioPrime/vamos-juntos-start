-- Fix critical security vulnerability: Restrict profiles table access
-- Drop the overly permissive policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);