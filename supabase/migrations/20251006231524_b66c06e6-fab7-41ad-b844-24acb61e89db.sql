-- Create financial_entry_payments table for tracking multiple payments per entry
CREATE TABLE IF NOT EXISTS public.financial_entry_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.financial_entries(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL DEFAULT 0,
  multa NUMERIC NOT NULL DEFAULT 0,
  juros NUMERIC NOT NULL DEFAULT 0,
  data_pagamento DATE NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  documento TEXT,
  is_conciliated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.financial_entry_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage payments from their organization"
  ON public.financial_entry_payments
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Create index for performance
CREATE INDEX idx_financial_entry_payments_entry_id ON public.financial_entry_payments(entry_id);
CREATE INDEX idx_financial_entry_payments_org_id ON public.financial_entry_payments(org_id);

-- Create trigger for updated_at
CREATE TRIGGER update_financial_entry_payments_updated_at
  BEFORE UPDATE ON public.financial_entry_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();