-- Add foreign key constraints between financial_entries and person tables
ALTER TABLE public.financial_entries 
ADD CONSTRAINT fk_financial_entries_customer_id 
FOREIGN KEY (person_id) REFERENCES public.customers(id);

ALTER TABLE public.financial_entries 
ADD CONSTRAINT fk_financial_entries_supplier_id 
FOREIGN KEY (person_id) REFERENCES public.suppliers(id);