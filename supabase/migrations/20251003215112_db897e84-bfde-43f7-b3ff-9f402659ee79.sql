-- ============================================================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA
-- ============================================================================

-- 1. CORRIGIR SEARCH PATH EM FUNÇÕES (Previne SQL Injection)
-- ============================================================================

-- Recriar função generate_next_entry_code com search_path
CREATE OR REPLACE FUNCTION public.generate_next_entry_code(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_code INTEGER;
BEGIN
  SELECT COALESCE(MAX(entry_code), 0) + 1
  INTO next_code
  FROM public.financial_entries
  WHERE org_id = p_org_id;
  
  RETURN next_code;
END;
$function$;

-- Recriar função set_entry_code com search_path
CREATE OR REPLACE FUNCTION public.set_entry_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.entry_code IS NULL THEN
    NEW.entry_code := public.generate_next_entry_code(NEW.org_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar função generate_next_purchase_number com search_path
CREATE OR REPLACE FUNCTION public.generate_next_purchase_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_number INTEGER;
  purchase_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.purchases
  WHERE org_id = p_org_id
    AND purchase_number ~ '^PED[0-9]+$';
  
  purchase_number := 'PED' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN purchase_number;
END;
$function$;

-- Recriar função set_purchase_number com search_path
CREATE OR REPLACE FUNCTION public.set_purchase_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.purchase_number IS NULL OR NEW.purchase_number = '' THEN
    NEW.purchase_number := public.generate_next_purchase_number(NEW.org_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar função update_supplier_modified_fields com search_path
CREATE OR REPLACE FUNCTION public.update_supplier_modified_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.last_modified_by = auth.uid();
  NEW.last_modified_at = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recriar função generate_next_payment_method_code com search_path
CREATE OR REPLACE FUNCTION public.generate_next_payment_method_code(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_code INTEGER;
  code_str TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(code AS INTEGER)), 20) + 1
  INTO next_code
  FROM public.payment_methods
  WHERE org_id = p_org_id
    AND code ~ '^[0-9]+$';
  
  code_str := LPAD(next_code::TEXT, 3, '0');
  
  WHILE EXISTS (SELECT 1 FROM public.payment_methods WHERE org_id = p_org_id AND code = code_str) LOOP
    next_code := next_code + 1;
    code_str := LPAD(next_code::TEXT, 3, '0');
  END LOOP;
  
  RETURN code_str;
END;
$function$;

-- Recriar função generate_cash_flow_projections com search_path
CREATE OR REPLACE FUNCTION public.generate_cash_flow_projections(p_org_id uuid, p_days_ahead integer DEFAULT 90)
RETURNS TABLE(projection_date date, projected_inflow numeric, projected_outflow numeric, projected_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  avg_daily_inflow NUMERIC;
  avg_daily_outflow NUMERIC;
  current_balance NUMERIC;
  i INTEGER;
  proj_date DATE;
BEGIN
  SELECT 
    COALESCE(AVG(CASE WHEN transaction_type = 'inflow' THEN amount ELSE 0 END), 0),
    COALESCE(AVG(CASE WHEN transaction_type = 'outflow' THEN amount ELSE 0 END), 0)
  INTO avg_daily_inflow, avg_daily_outflow
  FROM public.financial_transactions
  WHERE org_id = p_org_id 
    AND transaction_date >= CURRENT_DATE - INTERVAL '90 days';

  SELECT COALESCE(SUM(balance), 0)
  INTO current_balance
  FROM public.bank_accounts
  WHERE org_id = p_org_id AND is_active = true;

  FOR i IN 1..p_days_ahead LOOP
    proj_date := CURRENT_DATE + (i || ' days')::INTERVAL;
    
    RETURN QUERY SELECT 
      proj_date,
      avg_daily_inflow,
      avg_daily_outflow,
      current_balance + (avg_daily_inflow - avg_daily_outflow) * i;
  END LOOP;
END;
$function$;

-- 2. MOVER EXTENSÃO PG_TRGM PARA SCHEMA EXTENSIONS (Segurança)
-- ============================================================================

-- Criar schema extensions se não existir
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover extensão pg_trgm do public para extensions
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Garantir que o schema extensions está no search_path
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Comentários para documentação
COMMENT ON SCHEMA extensions IS 'Schema dedicado para extensões do PostgreSQL - isolado do schema public por segurança';
COMMENT ON EXTENSION pg_trgm IS 'Extensão para busca de texto com similaridade - movida para schema extensions por segurança';