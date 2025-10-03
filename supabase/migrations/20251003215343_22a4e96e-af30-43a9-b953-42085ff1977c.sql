-- ============================================================================
-- CORREÇÃO FINAL DE SEGURANÇA - ÚLTIMA FUNÇÃO SEM SEARCH_PATH
-- ============================================================================

-- Recriar função update_bank_account_balance com search_path
CREATE OR REPLACE FUNCTION public.update_bank_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.transaction_type = 'inflow' THEN
      UPDATE public.bank_accounts 
      SET balance = balance + NEW.amount
      WHERE id = NEW.bank_account_id;
    ELSIF NEW.transaction_type = 'outflow' THEN
      UPDATE public.bank_accounts 
      SET balance = balance - NEW.amount
      WHERE id = NEW.bank_account_id;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Adicionar comentário de segurança
COMMENT ON FUNCTION public.update_bank_account_balance() IS 'Trigger function para atualizar saldo de contas bancárias - search_path fixado para segurança';