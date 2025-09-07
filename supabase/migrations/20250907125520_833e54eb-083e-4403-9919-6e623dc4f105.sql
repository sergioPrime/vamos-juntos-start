-- Create chart of accounts table
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
  parent_id UUID NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, account_code)
);

-- Enable RLS for chart_of_accounts
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for chart_of_accounts
CREATE POLICY "Users can manage chart of accounts from their organization" 
ON public.chart_of_accounts 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create financial entries table (unified receivables and payables)
CREATE TABLE public.financial_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  company_id UUID NULL,
  entry_type TEXT NOT NULL, -- 'receivable' or 'payable'
  person_type TEXT NOT NULL, -- 'customer' or 'supplier'
  person_id UUID NOT NULL,
  chart_of_account_id UUID NULL,
  amount NUMERIC NOT NULL,
  payment_method_id UUID NULL,
  bank_account_id UUID NULL,
  competence_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE NULL,
  settled_payment_method_id UUID NULL,
  description TEXT,
  origin_type TEXT NULL, -- 'order', 'purchase', 'manual'
  origin_id UUID NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for financial_entries
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for financial_entries
CREATE POLICY "Users can manage financial entries from their organization" 
ON public.financial_entries 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_financial_entries_org_type_due ON public.financial_entries(org_id, entry_type, due_date);
CREATE INDEX idx_financial_entries_origin ON public.financial_entries(origin_type, origin_id);
CREATE INDEX idx_chart_of_accounts_org_active ON public.chart_of_accounts(org_id, is_active);

-- Create trigger to update updated_at column for chart_of_accounts
CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update updated_at column for financial_entries
CREATE TRIGGER update_financial_entries_updated_at
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle financial entry settlement
CREATE OR REPLACE FUNCTION public.handle_financial_entry_settlement()
RETURNS TRIGGER AS $$
BEGIN
  -- If entry is being marked as settled, create a financial transaction
  IF NEW.is_settled = true AND OLD.is_settled = false THEN
    INSERT INTO public.financial_transactions (
      org_id,
      company_id,
      bank_account_id,
      transaction_type,
      amount,
      transaction_date,
      description,
      reference_type,
      reference_id,
      created_by
    ) VALUES (
      NEW.org_id,
      NEW.company_id,
      COALESCE(NEW.bank_account_id, OLD.bank_account_id),
      CASE 
        WHEN NEW.entry_type = 'receivable' THEN 'inflow'
        WHEN NEW.entry_type = 'payable' THEN 'outflow'
      END,
      NEW.amount,
      COALESCE(NEW.settled_at::DATE, CURRENT_DATE),
      COALESCE(NEW.description, 'Liquidação de ' || 
        CASE 
          WHEN NEW.entry_type = 'receivable' THEN 'conta a receber'
          WHEN NEW.entry_type = 'payable' THEN 'conta a pagar'
        END),
      'financial_entry',
      NEW.id,
      NEW.created_by
    );
    
    -- Set settled_at if not already set
    IF NEW.settled_at IS NULL THEN
      NEW.settled_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for financial entry settlement
CREATE TRIGGER handle_financial_entry_settlement
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_financial_entry_settlement();

-- Insert some default chart of accounts for testing
INSERT INTO public.chart_of_accounts (org_id, account_code, account_name, account_type, description) VALUES
(gen_random_uuid(), '1.1.01', 'Caixa', 'asset', 'Dinheiro em caixa'),
(gen_random_uuid(), '1.1.02', 'Bancos', 'asset', 'Contas bancárias'),
(gen_random_uuid(), '1.2.01', 'Contas a Receber', 'asset', 'Valores a receber de clientes'),
(gen_random_uuid(), '2.1.01', 'Contas a Pagar', 'liability', 'Valores a pagar para fornecedores'),
(gen_random_uuid(), '3.1.01', 'Receitas de Vendas', 'revenue', 'Receitas provenientes de vendas'),
(gen_random_uuid(), '4.1.01', 'Despesas Operacionais', 'expense', 'Despesas do dia a dia');