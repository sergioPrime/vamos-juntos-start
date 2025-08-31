-- Advanced Purchase Features Migration (Fixed)

-- 1. Recurring Purchase Templates
CREATE TABLE public.recurring_purchase_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  created_by UUID NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  frequency_interval INTEGER NOT NULL DEFAULT 1,
  cost_center TEXT,
  project_code TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_execution_date TIMESTAMP WITH TIME ZONE,
  last_executed_date TIMESTAMP WITH TIME ZONE,
  auto_submit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Recurring Purchase Template Items
CREATE TABLE public.recurring_purchase_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.recurring_purchase_templates(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  estimated_unit_price NUMERIC NOT NULL DEFAULT 0,
  supplier_suggestion TEXT,
  justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Purchase Budget Plans
CREATE TABLE public.purchase_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  created_by UUID NOT NULL,
  budget_name TEXT NOT NULL,
  budget_year INTEGER NOT NULL,
  cost_center TEXT,
  category TEXT,
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  spent_amount NUMERIC NOT NULL DEFAULT 0,
  reserved_amount NUMERIC NOT NULL DEFAULT 0,
  available_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Budget Monthly Breakdown
CREATE TABLE public.budget_monthly_breakdown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.purchase_budgets(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  spent_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(budget_id, month)
);

-- 5. Approval Policy Configuration
CREATE TABLE public.approval_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  policy_name TEXT NOT NULL,
  description TEXT,
  cost_center TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Approval Policy Levels
CREATE TABLE public.approval_policy_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.approval_policies(id) ON DELETE CASCADE,
  level_order INTEGER NOT NULL,
  level_name TEXT NOT NULL,
  min_amount NUMERIC NOT NULL DEFAULT 0,
  max_amount NUMERIC,
  required_role TEXT CHECK (required_role IN ('buyer', 'requester', 'manager', 'admin')),
  approver_count INTEGER NOT NULL DEFAULT 1,
  timeout_days INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(policy_id, level_order)
);

-- 7. Budget Monitoring Alerts
CREATE TABLE public.budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.purchase_budgets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold', 'overspent', 'monthly_limit')),
  threshold_percentage NUMERIC,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_purchase_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_purchase_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_monthly_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_policy_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Recurring Purchase Templates
CREATE POLICY "Users can view recurring templates from their organization"
ON public.recurring_purchase_templates
FOR SELECT
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert recurring templates for their organization"
ON public.recurring_purchase_templates
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update recurring templates from their organization"
ON public.recurring_purchase_templates
FOR UPDATE
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can delete recurring templates from their organization"
ON public.recurring_purchase_templates
FOR DELETE
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- RLS Policies for Recurring Purchase Template Items
CREATE POLICY "Users can manage template items from their organization"
ON public.recurring_purchase_template_items
FOR ALL
USING (template_id IN (
  SELECT recurring_purchase_templates.id
  FROM recurring_purchase_templates
  WHERE recurring_purchase_templates.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

-- RLS Policies for Purchase Budgets
CREATE POLICY "Users can view budgets from their organization"
ON public.purchase_budgets
FOR SELECT
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert budgets for their organization"
ON public.purchase_budgets
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update budgets from their organization"
ON public.purchase_budgets
FOR UPDATE
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can delete budgets from their organization"
ON public.purchase_budgets
FOR DELETE
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- RLS Policies for Budget Monthly Breakdown
CREATE POLICY "Users can manage budget breakdown from their organization"
ON public.budget_monthly_breakdown
FOR ALL
USING (budget_id IN (
  SELECT purchase_budgets.id
  FROM purchase_budgets
  WHERE purchase_budgets.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

-- RLS Policies for Approval Policies
CREATE POLICY "Users can view approval policies from their organization"
ON public.approval_policies
FOR SELECT
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Admins can manage approval policies"
ON public.approval_policies
FOR ALL
USING (
  org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  ) AND has_purchase_role(auth.uid(), 'admin')
);

-- RLS Policies for Approval Policy Levels
CREATE POLICY "Users can view approval policy levels from their organization"
ON public.approval_policy_levels
FOR SELECT
USING (policy_id IN (
  SELECT approval_policies.id
  FROM approval_policies
  WHERE approval_policies.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

CREATE POLICY "Admins can manage approval policy levels"
ON public.approval_policy_levels
FOR ALL
USING (policy_id IN (
  SELECT approval_policies.id
  FROM approval_policies
  WHERE approval_policies.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  ) AND has_purchase_role(auth.uid(), 'admin')
));

-- RLS Policies for Budget Alerts
CREATE POLICY "Users can view budget alerts from their organization"
ON public.budget_alerts
FOR SELECT
USING (budget_id IN (
  SELECT purchase_budgets.id
  FROM purchase_budgets
  WHERE purchase_budgets.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

-- Triggers for updated_at columns
CREATE TRIGGER update_recurring_purchase_templates_updated_at
  BEFORE UPDATE ON public.recurring_purchase_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_budgets_updated_at
  BEFORE UPDATE ON public.purchase_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_monthly_breakdown_updated_at
  BEFORE UPDATE ON public.budget_monthly_breakdown
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_policies_updated_at
  BEFORE UPDATE ON public.approval_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check budget alerts
CREATE OR REPLACE FUNCTION public.check_budget_alerts()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  usage_percentage NUMERIC;
BEGIN
  SELECT * INTO budget_record
  FROM public.purchase_budgets
  WHERE id = NEW.id;
  
  IF budget_record.planned_amount > 0 THEN
    usage_percentage := (budget_record.spent_amount / budget_record.planned_amount) * 100;
    
    -- Check for 80% threshold alert
    IF usage_percentage >= 80 AND NOT EXISTS (
      SELECT 1 FROM public.budget_alerts
      WHERE budget_id = NEW.id 
      AND alert_type = 'threshold' 
      AND is_triggered = true
    ) THEN
      INSERT INTO public.budget_alerts (budget_id, alert_type, threshold_percentage, is_triggered, triggered_at, message)
      VALUES (NEW.id, 'threshold', 80, true, now(), 'Orçamento atingiu 80% do valor planejado');
    END IF;
    
    -- Check for overspent alert
    IF usage_percentage > 100 AND NOT EXISTS (
      SELECT 1 FROM public.budget_alerts
      WHERE budget_id = NEW.id 
      AND alert_type = 'overspent' 
      AND is_triggered = true
    ) THEN
      INSERT INTO public.budget_alerts (budget_id, alert_type, is_triggered, triggered_at, message)
      VALUES (NEW.id, 'overspent', true, now(), 'Orçamento extrapolado - valor gasto excede o planejado');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check budget alerts when spent amount changes
CREATE TRIGGER check_budget_alerts_trigger
  AFTER UPDATE ON public.purchase_budgets
  FOR EACH ROW
  WHEN (OLD.spent_amount IS DISTINCT FROM NEW.spent_amount)
  EXECUTE FUNCTION public.check_budget_alerts();