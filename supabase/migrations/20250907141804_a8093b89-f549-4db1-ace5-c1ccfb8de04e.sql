-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add performance indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_org_active ON public.chart_of_accounts (org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_name_gin ON public.chart_of_accounts USING gin (account_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cost_centers_org_active ON public.cost_centers (org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_cost_centers_name_gin ON public.cost_centers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_financial_entries_org_dates ON public.financial_entries (org_id, competence_date, due_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_chart_account ON public.financial_entries (chart_of_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_cost_center ON public.financial_entries (cost_center_id);

-- Add foreign key constraints (with safe checks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_financial_entries_chart_account'
    ) THEN
        ALTER TABLE public.financial_entries 
        ADD CONSTRAINT fk_financial_entries_chart_account 
        FOREIGN KEY (chart_of_account_id) 
        REFERENCES public.chart_of_accounts(id) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_financial_entries_cost_center'
    ) THEN
        ALTER TABLE public.financial_entries 
        ADD CONSTRAINT fk_financial_entries_cost_center 
        FOREIGN KEY (cost_center_id) 
        REFERENCES public.cost_centers(id) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Create function to validate hierarchy (prevent cycles)
CREATE OR REPLACE FUNCTION public.validate_hierarchy_cycle(
    table_name text,
    new_id uuid,
    new_parent_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_parent uuid;
    max_depth integer := 10;
    depth integer := 0;
BEGIN
    IF new_parent_id IS NULL THEN
        RETURN true;
    END IF;
    
    current_parent := new_parent_id;
    
    WHILE current_parent IS NOT NULL AND depth < max_depth LOOP
        IF current_parent = new_id THEN
            RETURN false; -- Cycle detected
        END IF;
        
        IF table_name = 'chart_of_accounts' THEN
            SELECT parent_id INTO current_parent 
            FROM public.chart_of_accounts 
            WHERE id = current_parent;
        ELSIF table_name = 'cost_centers' THEN
            SELECT parent_id INTO current_parent 
            FROM public.cost_centers 
            WHERE id = current_parent;
        END IF;
        
        depth := depth + 1;
    END LOOP;
    
    RETURN true;
END;
$$;

-- Create function to validate account code hierarchy
CREATE OR REPLACE FUNCTION public.validate_account_code_hierarchy(
    new_account_code text,
    parent_account_code text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    parent_levels integer;
    new_levels integer;
BEGIN
    IF parent_account_code IS NULL THEN
        RETURN true;
    END IF;
    
    -- Count levels (dots + 1)
    parent_levels := array_length(string_to_array(parent_account_code, '.'), 1);
    new_levels := array_length(string_to_array(new_account_code, '.'), 1);
    
    -- New code should have exactly one more level than parent
    IF new_levels != parent_levels + 1 THEN
        RETURN false;
    END IF;
    
    -- New code should start with parent code + dot
    IF NOT new_account_code LIKE parent_account_code || '.%' THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Create function to check if item has children
CREATE OR REPLACE FUNCTION public.has_children(
    table_name text,
    item_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    child_count integer;
BEGIN
    IF table_name = 'chart_of_accounts' THEN
        SELECT COUNT(*) INTO child_count 
        FROM public.chart_of_accounts 
        WHERE parent_id = item_id AND is_active = true;
    ELSIF table_name = 'cost_centers' THEN
        SELECT COUNT(*) INTO child_count 
        FROM public.cost_centers 
        WHERE parent_id = item_id AND is_active = true;
    END IF;
    
    RETURN child_count > 0;
END;
$$;

-- Create function to check if item is used in financial entries
CREATE OR REPLACE FUNCTION public.is_used_in_financial_entries(
    reference_type text,
    item_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_count integer;
BEGIN
    IF reference_type = 'chart_of_account' THEN
        SELECT COUNT(*) INTO usage_count 
        FROM public.financial_entries 
        WHERE chart_of_account_id = item_id;
    ELSIF reference_type = 'cost_center' THEN
        SELECT COUNT(*) INTO usage_count 
        FROM public.financial_entries 
        WHERE cost_center_id = item_id;
    END IF;
    
    RETURN usage_count > 0;
END;
$$;

-- Create analytical accounts view
CREATE OR REPLACE VIEW public.analytical_accounts
WITH (security_invoker=on)
AS
SELECT 
    id,
    org_id,
    account_code,
    account_name,
    description,
    nature_code,
    is_expense,
    parent_id,
    created_at,
    updated_at
FROM public.chart_of_accounts
WHERE account_type = 'analytic' AND is_active = true;

-- Grant access to analytical accounts view
GRANT SELECT ON public.analytical_accounts TO authenticated;

-- Update financial_entries_report view to be more comprehensive
DROP VIEW IF EXISTS public.financial_entries_report;
CREATE OR REPLACE VIEW public.financial_entries_report
WITH (security_invoker=on)
AS
SELECT 
    fe.id,
    fe.org_id,
    fe.company_id,
    fe.person_id,
    fe.person_type,
    fe.entry_type,
    fe.chart_of_account_id,
    fe.cost_center_id,
    fe.amount,
    fe.competence_date,
    fe.due_date,
    fe.is_settled,
    fe.settled_at,
    fe.description,
    fe.origin_type,
    fe.origin_id,
    fe.created_by,
    fe.created_at,
    fe.updated_at,
    fe.bank_account_id,
    fe.payment_method_id,
    fe.settled_payment_method_id,
    -- Chart of account data
    coa.account_code,
    coa.account_name,
    coa.nature_code,
    coa.is_expense,
    -- Cost center data
    cc.code as cost_center_code,
    cc.name as cost_center_name,
    -- Company data
    comp.name as company_name,
    -- Person data (customers or suppliers)
    CASE 
        WHEN fe.person_type = 'customer' THEN cust.name
        WHEN fe.person_type = 'supplier' THEN supp.name
        ELSE NULL
    END as person_name
FROM public.financial_entries fe
LEFT JOIN public.chart_of_accounts coa ON fe.chart_of_account_id = coa.id
LEFT JOIN public.cost_centers cc ON fe.cost_center_id = cc.id
LEFT JOIN public.companies comp ON fe.company_id = comp.id
LEFT JOIN public.customers cust ON fe.person_type = 'customer' AND fe.person_id = cust.id
LEFT JOIN public.suppliers supp ON fe.person_type = 'supplier' AND fe.person_id = supp.id;

-- Grant access to financial entries report view
GRANT SELECT ON public.financial_entries_report TO authenticated;