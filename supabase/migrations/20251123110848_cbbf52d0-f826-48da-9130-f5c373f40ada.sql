-- Create subscriptions table for license management
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'active',
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('basic', 'professional', 'enterprise')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage all subscriptions
CREATE POLICY "Superadmins can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

-- Organizations can view their own subscription
CREATE POLICY "Organizations can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX idx_subscriptions_expiration ON public.subscriptions(expiration_date);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);