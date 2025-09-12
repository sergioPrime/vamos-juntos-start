-- Add foreign key constraint between bank_accounts and companies
ALTER TABLE public.bank_accounts 
ADD CONSTRAINT fk_bank_accounts_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id);