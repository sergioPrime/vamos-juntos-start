-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  features TEXT[] DEFAULT '{}',
  max_users INTEGER,
  max_invoices INTEGER,
  max_customers INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active plans
CREATE POLICY "Users can view active subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true);

-- Only superadmins can modify plans
CREATE POLICY "Superadmins can manage subscription plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Add superadmin role to app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'superadmin');
    ELSE
        -- Add superadmin to existing enum
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
    END IF;
END $$;

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, billing_cycle, features, max_users, max_invoices, max_customers, sort_order) VALUES
('Básico', 'Ideal para MEIs iniciantes', 0.00, 'monthly', '{"Até 10 clientes", "Até 20 faturas/mês", "Suporte por email"}', 1, 20, 10, 1),
('Profissional', 'Para MEIs em crescimento', 29.90, 'monthly', '{"Até 100 clientes", "Faturas ilimitadas", "NFS-e", "Suporte prioritário"}', 3, -1, 100, 2),
('Premium', 'Para MEIs consolidados', 59.90, 'monthly', '{"Clientes ilimitados", "Faturas ilimitadas", "NFS-e", "Relatórios avançados", "Suporte telefônico"}', 5, -1, -1, 3),
('Enterprise', 'Para empresas de pequeno porte', 99.90, 'monthly', '{"Tudo do Premium", "Multi-usuários", "API personalizada", "Gerente de conta dedicado"}', -1, -1, -1, 4);

-- Create trigger for updated_at
CREATE TRIGGER subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add subscription plan to user organizations
ALTER TABLE public.user_organizations 
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;