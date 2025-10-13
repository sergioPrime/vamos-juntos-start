-- Remover funções antigas e recriar com tipo correto

-- Drop funções existentes
DROP FUNCTION IF EXISTS public.generate_next_purchase_number(uuid);

-- Funções para gerar números sequenciais numéricos

-- Função para pedidos (orders)
CREATE OR REPLACE FUNCTION public.generate_next_order_number(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(order_number AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.orders
  WHERE org_id = p_org_id
    AND order_number ~ '^[0-9]+$';
  
  RETURN next_number;
END;
$function$;

-- Função para orçamentos (quotes)
CREATE OR REPLACE FUNCTION public.generate_next_quote_number(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(number AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.quotes
  WHERE org_id = p_org_id
    AND number ~ '^[0-9]+$';
  
  RETURN next_number;
END;
$function$;

-- Função de compras para retornar número simples
CREATE FUNCTION public.generate_next_purchase_number(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(purchase_number AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.purchases
  WHERE org_id = p_org_id
    AND purchase_number ~ '^[0-9]+$';
  
  RETURN next_number;
END;
$function$;

-- Função para sessões de caixa (PDV)
CREATE OR REPLACE FUNCTION public.generate_next_caixa_number(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0) + 1
  INTO next_number
  FROM public.caixa_sessoes
  WHERE org_id = p_org_id;
  
  RETURN next_number;
END;
$function$;

-- Triggers para aplicar números automaticamente

-- Trigger para pedidos
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_next_order_number(NEW.org_id)::text;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Trigger para orçamentos
CREATE OR REPLACE FUNCTION public.set_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.number IS NULL OR NEW.number = '' THEN
    NEW.number := public.generate_next_quote_number(NEW.org_id)::text;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_quote_number_trigger ON public.quotes;
CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quote_number();

-- Atualizar trigger de compras
CREATE OR REPLACE FUNCTION public.set_purchase_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.purchase_number IS NULL OR NEW.purchase_number = '' THEN
    NEW.purchase_number := public.generate_next_purchase_number(NEW.org_id)::text;
  END IF;
  
  RETURN NEW;
END;
$function$;