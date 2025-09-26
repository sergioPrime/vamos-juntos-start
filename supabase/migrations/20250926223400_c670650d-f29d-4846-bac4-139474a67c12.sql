-- Phase 1: Critical Database Security Fixes (Continued)
-- Fix remaining database functions that need SET search_path

CREATE OR REPLACE FUNCTION public.validate_chart_account_cost_centers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  acc_type text;
  acc_active boolean;
  acc_org uuid;
  cc_active boolean;
  cc_org uuid;
BEGIN
  -- Validate account exists and is analytic + active
  SELECT account_type, is_active, org_id INTO acc_type, acc_active, acc_org
  FROM public.chart_of_accounts WHERE id = NEW.chart_of_account_id;
  IF acc_type IS NULL THEN
    RAISE EXCEPTION 'Conta contábil inexistente';
  END IF;
  IF acc_type <> 'analytic' THEN
    RAISE EXCEPTION 'Apenas contas analíticas podem ter centros de custo associados';
  END IF;
  IF NOT acc_active THEN
    RAISE EXCEPTION 'Conta contábil deve estar ativa para associar centros de custo';
  END IF;

  -- Validate cost center exists and is active
  SELECT is_active, org_id INTO cc_active, cc_org
  FROM public.cost_centers WHERE id = NEW.cost_center_id;
  IF cc_active IS NULL THEN
    RAISE EXCEPTION 'Centro de custo inexistente';
  END IF;
  IF NOT cc_active THEN
    RAISE EXCEPTION 'Centro de custo deve estar ativo para ser associado';
  END IF;

  -- Must belong to the same organization
  IF acc_org <> cc_org THEN
    RAISE EXCEPTION 'Conta e Centro de Custo devem pertencer à mesma organização';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_cacc_on_account_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- If account becomes synthetic or inactive, remove associations
    IF (OLD.account_type = 'analytic' AND NEW.account_type = 'synthetic') OR (OLD.is_active = true AND NEW.is_active = false) THEN
      DELETE FROM public.chart_account_cost_centers WHERE chart_of_account_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_cacc_on_cost_center_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    DELETE FROM public.chart_account_cost_centers WHERE cost_center_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_chart_of_accounts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    parent_code text;
BEGIN
    -- Validate hierarchy cycle
    IF NOT public.validate_hierarchy_cycle('chart_of_accounts', NEW.id, NEW.parent_id) THEN
        RAISE EXCEPTION 'Hierarquia circular detectada';
    END IF;
    
    -- Validate account code hierarchy
    IF NEW.parent_id IS NOT NULL THEN
        SELECT account_code INTO parent_code 
        FROM public.chart_of_accounts 
        WHERE id = NEW.parent_id;
        
        IF NOT public.validate_account_code_hierarchy(NEW.account_code, parent_code) THEN
            RAISE EXCEPTION 'Código da conta deve seguir hierarquia do pai: %', parent_code;
        END IF;
    END IF;
    
    -- Prevent deactivation if has children or is used
    IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
        IF public.has_children('chart_of_accounts', NEW.id) THEN
            RAISE EXCEPTION 'Não é possível desativar conta com filhos ativos';
        END IF;
        
        IF public.is_used_in_financial_entries('chart_of_account', NEW.id) THEN
            RAISE EXCEPTION 'Não é possível desativar conta em uso em lançamentos';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_cost_centers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    -- Validate hierarchy cycle
    IF NOT public.validate_hierarchy_cycle('cost_centers', NEW.id, NEW.parent_id) THEN
        RAISE EXCEPTION 'Hierarquia circular detectada';
    END IF;
    
    -- Prevent deactivation if has children or is used
    IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
        IF public.has_children('cost_centers', NEW.id) THEN
            RAISE EXCEPTION 'Não é possível desativar centro de custo com filhos ativos';
        END IF;
        
        IF public.is_used_in_financial_entries('cost_center', NEW.id) THEN
            RAISE EXCEPTION 'Não é possível desativar centro de custo em uso em lançamentos';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_financial_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.validate_hierarchy_cycle(table_name text, new_id uuid, new_parent_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_used_in_financial_entries(reference_type text, item_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.validate_account_code_hierarchy(new_account_code text, parent_account_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.has_children(table_name text, item_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;