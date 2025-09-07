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