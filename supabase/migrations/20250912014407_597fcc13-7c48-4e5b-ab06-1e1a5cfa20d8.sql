-- Remove the incorrectly added foreign key constraints
ALTER TABLE public.financial_entries 
DROP CONSTRAINT IF EXISTS fk_financial_entries_customer_id;

ALTER TABLE public.financial_entries 
DROP CONSTRAINT IF EXISTS fk_financial_entries_supplier_id;