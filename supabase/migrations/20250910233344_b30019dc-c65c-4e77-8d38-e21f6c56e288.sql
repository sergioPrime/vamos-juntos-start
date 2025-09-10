-- Add code column to payment_methods table
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS code TEXT;

-- Create unique index on code within organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_org_code ON public.payment_methods(org_id, code);

-- Insert default payment methods for existing organizations
INSERT INTO public.payment_methods (org_id, name, code, type, active)
SELECT 
  o.id as org_id,
  pm.name,
  pm.code,
  pm.type,
  true as active
FROM public.organizations o
CROSS JOIN (VALUES
  ('Dinheiro', '001', 'cash'),
  ('Cheque', '002', 'check'),
  ('Cartão de Crédito', '003', 'credit_card'),
  ('Cartão de Débito', '004', 'debit_card'),
  ('Crédito Loja', '005', 'store_credit'),
  ('Vale Crédito', '006', 'credit_voucher'),
  ('Vale Alimentação', '007', 'meal_voucher'),
  ('Vale Refeição', '008', 'food_voucher'),
  ('Vale Presente', '009', 'gift_voucher'),
  ('Vale Combustível', '010', 'fuel_voucher'),
  ('Duplicata', '011', 'promissory_note'),
  ('Boleto Bancário', '012', 'bank_slip'),
  ('Depósito Bancário', '013', 'bank_deposit'),
  ('PIX', '014', 'pix'),
  ('Transferência Bancária', '015', 'bank_transfer'),
  ('Carteira Digital', '016', 'digital_wallet'),
  ('Programa de Fidelidade', '017', 'loyalty_program'),
  ('Cashback', '018', 'cashback'),
  ('Crédito Virtual', '019', 'virtual_credit'),
  ('Outros', '020', 'other')
) AS pm(name, code, type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm2 
  WHERE pm2.org_id = o.id AND pm2.code = pm.code
);

-- Add is_default column to track system-generated payment methods
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;

-- Mark the inserted default payment methods
UPDATE public.payment_methods 
SET is_default = true 
WHERE code IN ('001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014', '015', '016', '017', '018', '019', '020');

-- Create function to auto-generate next code for custom payment methods
CREATE OR REPLACE FUNCTION public.generate_next_payment_method_code(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_code INTEGER;
  code_str TEXT;
BEGIN
  -- Find the highest numeric code for the organization
  SELECT COALESCE(MAX(CAST(code AS INTEGER)), 20) + 1
  INTO next_code
  FROM public.payment_methods
  WHERE org_id = p_org_id
    AND code ~ '^[0-9]+$';
  
  -- Format as 3-digit string
  code_str := LPAD(next_code::TEXT, 3, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.payment_methods WHERE org_id = p_org_id AND code = code_str) LOOP
    next_code := next_code + 1;
    code_str := LPAD(next_code::TEXT, 3, '0');
  END LOOP;
  
  RETURN code_str;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;