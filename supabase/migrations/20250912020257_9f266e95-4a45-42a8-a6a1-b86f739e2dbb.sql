-- Fix ambiguous column reference in validate_financial_entries function
CREATE OR REPLACE FUNCTION public.validate_financial_entries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    chart_account_type text;
    account_active boolean;
    center_active boolean;
BEGIN
    -- Validate chart of account is analytical and active
    IF NEW.chart_of_account_id IS NOT NULL THEN
        SELECT coa.account_type, coa.is_active INTO chart_account_type, account_active
        FROM public.chart_of_accounts coa
        WHERE coa.id = NEW.chart_of_account_id;
        
        IF chart_account_type != 'analytic' THEN
            RAISE EXCEPTION 'Apenas contas analíticas podem ser usadas em lançamentos';
        END IF;
        
        IF NOT account_active THEN
            RAISE EXCEPTION 'Conta deve estar ativa para ser usada em lançamentos';
        END IF;
    END IF;
    
    -- Validate cost center is active
    IF NEW.cost_center_id IS NOT NULL THEN
        SELECT cc.is_active INTO center_active
        FROM public.cost_centers cc
        WHERE cc.id = NEW.cost_center_id;
        
        IF NOT center_active THEN
            RAISE EXCEPTION 'Centro de custo deve estar ativo para ser usado em lançamentos';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;