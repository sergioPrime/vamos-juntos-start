-- Expand bank_accounts table with additional fields for boleto emission and detailed account info
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS agency_digit text,
ADD COLUMN IF NOT EXISTS account_digit text,
ADD COLUMN IF NOT EXISTS emit_boletos_erp boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_pix_sales boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS initial_number integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_interest numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fine_percentage numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_until_due numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS emit_with_receipt boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_instruction_after_due text,
ADD COLUMN IF NOT EXISTS bank_can_protest boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_can_return boolean DEFAULT false;

-- Create bank_wallets table for carteiras configuration
CREATE TABLE IF NOT EXISTS public.bank_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  name text NOT NULL,
  agreement_number text,
  fee numeric(10,2) DEFAULT 0,
  add_fee_to_amount boolean DEFAULT false,
  with_registration boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for bank_wallets
ALTER TABLE public.bank_wallets ENABLE ROW LEVEL SECURITY;

-- Create policy for bank_wallets
CREATE POLICY "Users can manage bank wallets from their organization" 
ON public.bank_wallets 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Add updated_at trigger to bank_wallets
CREATE TRIGGER update_bank_wallets_updated_at
  BEFORE UPDATE ON public.bank_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();