-- Add subscription fields to user_organizations table
ALTER TABLE public.user_organizations 
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_subscription_plan 
ON public.user_organizations(subscription_plan_id);

-- Add index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_user_organizations_subscription_status 
ON public.user_organizations(subscription_status);