-- Check and remove duplicate foreign key constraints for chart_of_accounts
-- First, let's see what constraints exist
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Drop the duplicate/conflicting foreign key constraints
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint c 
        JOIN pg_class t ON c.conrelid = t.oid 
        WHERE t.relname = 'financial_entries' 
        AND c.contype = 'f'
        AND conname LIKE '%chart_account%'
    LOOP
        EXECUTE 'ALTER TABLE public.financial_entries DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Create a single, correctly named foreign key constraint
ALTER TABLE public.financial_entries 
ADD CONSTRAINT fk_financial_entries_chart_of_account_id 
FOREIGN KEY (chart_of_account_id) REFERENCES public.chart_of_accounts(id);