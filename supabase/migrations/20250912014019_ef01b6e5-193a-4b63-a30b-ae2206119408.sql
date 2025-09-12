-- Add foreign key constraint between financial_entries and companies
ALTER TABLE public.financial_entries 
ADD CONSTRAINT fk_financial_entries_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id);