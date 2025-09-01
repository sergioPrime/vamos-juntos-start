-- Create companies table for multi-company support
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'BR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  org_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Users can manage companies from their organization" 
ON public.companies FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create bank_accounts table for multi-bank support
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking',
  agency TEXT,
  balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  company_id UUID,
  org_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for bank_accounts
CREATE POLICY "Users can manage bank accounts from their organization" 
ON public.bank_accounts FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create cash_flow_projections table for forecasting
CREATE TABLE public.cash_flow_projections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_date DATE NOT NULL,
  projected_inflow NUMERIC NOT NULL DEFAULT 0,
  projected_outflow NUMERIC NOT NULL DEFAULT 0,
  projected_balance NUMERIC NOT NULL DEFAULT 0,
  confidence_level NUMERIC NOT NULL DEFAULT 0.8,
  projection_type TEXT NOT NULL DEFAULT 'auto', -- auto, manual
  bank_account_id UUID,
  company_id UUID,
  org_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cash_flow_projections
ALTER TABLE public.cash_flow_projections ENABLE ROW LEVEL SECURITY;

-- Create policies for cash_flow_projections
CREATE POLICY "Users can manage cash flow projections from their organization" 
ON public.cash_flow_projections FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create financial_transactions table for historical data
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL, -- inflow, outflow
  category TEXT,
  description TEXT,
  reference_id UUID,
  reference_type TEXT, -- invoice, payment, expense, etc.
  bank_account_id UUID,
  company_id UUID,
  org_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_transactions
CREATE POLICY "Users can manage financial transactions from their organization" 
ON public.financial_transactions FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create api_integrations table for external integrations
CREATE TABLE public.api_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_name TEXT NOT NULL,
  integration_type TEXT NOT NULL, -- accounting, banking, payment
  api_url TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency INTEGER DEFAULT 24, -- hours
  org_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for api_integrations
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for api_integrations
CREATE POLICY "Users can manage API integrations from their organization" 
ON public.api_integrations FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create updated_at triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_flow_projections_updated_at
  BEFORE UPDATE ON public.cash_flow_projections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at
  BEFORE UPDATE ON public.api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update bank account balance
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.transaction_type = 'inflow' THEN
      UPDATE public.bank_accounts 
      SET balance = balance + NEW.amount
      WHERE id = NEW.bank_account_id;
    ELSIF NEW.transaction_type = 'outflow' THEN
      UPDATE public.bank_accounts 
      SET balance = balance - NEW.amount
      WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for bank account balance updates
CREATE TRIGGER update_bank_balance_on_transaction
  AFTER INSERT ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bank_account_balance();

-- Function to generate cash flow projections
CREATE OR REPLACE FUNCTION public.generate_cash_flow_projections(
  p_org_id UUID,
  p_days_ahead INTEGER DEFAULT 90
)
RETURNS TABLE(
  projection_date DATE,
  projected_inflow NUMERIC,
  projected_outflow NUMERIC,
  projected_balance NUMERIC
) AS $$
DECLARE
  avg_daily_inflow NUMERIC;
  avg_daily_outflow NUMERIC;
  current_balance NUMERIC;
  i INTEGER;
  proj_date DATE;
BEGIN
  -- Calculate average daily inflow/outflow from last 3 months
  SELECT 
    COALESCE(AVG(CASE WHEN transaction_type = 'inflow' THEN amount ELSE 0 END), 0),
    COALESCE(AVG(CASE WHEN transaction_type = 'outflow' THEN amount ELSE 0 END), 0)
  INTO avg_daily_inflow, avg_daily_outflow
  FROM public.financial_transactions
  WHERE org_id = p_org_id 
    AND transaction_date >= CURRENT_DATE - INTERVAL '90 days';

  -- Get current total balance
  SELECT COALESCE(SUM(balance), 0)
  INTO current_balance
  FROM public.bank_accounts
  WHERE org_id = p_org_id AND is_active = true;

  -- Generate projections for each day
  FOR i IN 1..p_days_ahead LOOP
    proj_date := CURRENT_DATE + (i || ' days')::INTERVAL;
    
    RETURN QUERY SELECT 
      proj_date,
      avg_daily_inflow,
      avg_daily_outflow,
      current_balance + (avg_daily_inflow - avg_daily_outflow) * i;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;