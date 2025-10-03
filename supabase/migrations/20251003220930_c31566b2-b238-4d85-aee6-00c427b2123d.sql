-- ============================================================================
-- CORREÇÕES DE SEGURANÇA - INTEGRAÇÕES PDV COM FINANCEIRO E ESTOQUE
-- Items 5-9: Validações, auditoria e prevenção de duplicatas
-- ============================================================================

-- ============================================================================
-- ITEM 5: Adicionar validação em caixa_movimentacoes
-- ============================================================================

-- Adicionar índice para prevenção de duplicatas
CREATE INDEX IF NOT EXISTS idx_caixa_movimentacoes_reference 
ON public.caixa_movimentacoes(reference_type, reference_id, tipo);

-- Função de validação para movimentações de caixa
CREATE OR REPLACE FUNCTION public.validate_caixa_movimentacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  sessao_status text;
  sessao_org uuid;
BEGIN
  -- Validar se a sessão existe e está aberta (permitir NULL para movimentações sem sessão)
  IF NEW.sessao_id IS NOT NULL THEN
    SELECT status, org_id INTO sessao_status, sessao_org
    FROM public.caixa_sessoes
    WHERE id = NEW.sessao_id;
    
    IF sessao_status IS NULL THEN
      RAISE EXCEPTION 'Sessão de caixa não encontrada';
    END IF;
    
    IF sessao_status != 'aberto' THEN
      RAISE EXCEPTION 'Não é possível registrar movimentação em caixa fechado';
    END IF;
    
    -- Validar org_id consistente
    IF sessao_org != NEW.org_id THEN
      RAISE EXCEPTION 'Organização da sessão não corresponde à organização da movimentação';
    END IF;
  END IF;
  
  -- Validar tipos permitidos
  IF NEW.tipo NOT IN ('venda', 'suprimento', 'sangria', 'devolucao', 'abertura', 'fechamento') THEN
    RAISE EXCEPTION 'Tipo de movimentação inválido: %', NEW.tipo;
  END IF;
  
  -- Validar que created_by é o usuário autenticado
  IF NEW.created_by != auth.uid() THEN
    RAISE EXCEPTION 'Usuário não autorizado a criar movimentação';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger de validação
DROP TRIGGER IF EXISTS validate_caixa_movimentacao_trigger ON public.caixa_movimentacoes;
CREATE TRIGGER validate_caixa_movimentacao_trigger
  BEFORE INSERT OR UPDATE ON public.caixa_movimentacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_caixa_movimentacao();

-- ============================================================================
-- ITEM 6: Adicionar validação em stock_movements
-- ============================================================================

-- Função de validação para movimentações de estoque
CREATE OR REPLACE FUNCTION public.validate_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  product_org uuid;
  current_stock numeric;
BEGIN
  -- Validar quantidade positiva
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;
  
  -- Validar que produto existe e pertence à mesma organização
  SELECT org_id, stock_quantity INTO product_org, current_stock
  FROM public.products
  WHERE id = NEW.product_id;
  
  IF product_org IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;
  
  IF product_org != NEW.org_id THEN
    RAISE EXCEPTION 'Produto não pertence à organização';
  END IF;
  
  -- Validar estoque suficiente para saídas
  IF NEW.movement_type = 'out' AND current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', current_stock, NEW.quantity;
  END IF;
  
  -- Validar tipos permitidos
  IF NEW.movement_type NOT IN ('in', 'out', 'adjustment', 'transfer') THEN
    RAISE EXCEPTION 'Tipo de movimentação inválido: %', NEW.movement_type;
  END IF;
  
  -- Validar que created_by é o usuário autenticado
  IF NEW.created_by != auth.uid() THEN
    RAISE EXCEPTION 'Usuário não autorizado a criar movimentação de estoque';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger de validação
DROP TRIGGER IF EXISTS validate_stock_movement_trigger ON public.stock_movements;
CREATE TRIGGER validate_stock_movement_trigger
  BEFORE INSERT OR UPDATE ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_stock_movement();

-- ============================================================================
-- ITEM 7 e 8: Adicionar validações em financial_entries
-- ============================================================================

-- Adicionar constraint para prevenir duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_entries_unique_origin
ON public.financial_entries(org_id, origin_type, origin_id)
WHERE origin_type IS NOT NULL AND origin_id IS NOT NULL;

-- Adicionar índice para auditoria
CREATE INDEX IF NOT EXISTS idx_financial_entries_audit
ON public.financial_entries(created_by, created_at);

-- ============================================================================
-- ITEM 9: Criar tabela de auditoria para transações críticas
-- ============================================================================

-- Tabela de auditoria de transações
CREATE TABLE IF NOT EXISTS public.transaction_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action_type text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid NOT NULL,
  user_ip text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT transaction_audit_action_type_check 
    CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Habilitar RLS
ALTER TABLE public.transaction_audit ENABLE ROW LEVEL SECURITY;

-- Política RLS para auditoria (somente leitura para usuários da org)
DROP POLICY IF EXISTS "Users can view audit from their organization" ON public.transaction_audit;
CREATE POLICY "Users can view audit from their organization"
ON public.transaction_audit
FOR SELECT
USING (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transaction_audit_org_table 
ON public.transaction_audit(org_id, table_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_audit_record 
ON public.transaction_audit(table_name, record_id);

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  org_id_val uuid;
  user_id_val uuid;
BEGIN
  -- Determinar org_id
  IF TG_OP = 'DELETE' THEN
    org_id_val := OLD.org_id;
  ELSE
    org_id_val := NEW.org_id;
  END IF;
  
  -- Obter user_id
  user_id_val := auth.uid();
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Inserir registro de auditoria
  INSERT INTO public.transaction_audit (
    org_id,
    transaction_type,
    table_name,
    record_id,
    action_type,
    old_data,
    new_data,
    user_id
  ) VALUES (
    org_id_val,
    TG_ARGV[0], -- Nome da transação (ex: 'PDV_SALE', 'STOCK_MOVEMENT')
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    user_id_val
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Aplicar auditoria em orders
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_transaction('PDV_SALE');

-- Aplicar auditoria em stock_movements
DROP TRIGGER IF EXISTS audit_stock_movements_trigger ON public.stock_movements;
CREATE TRIGGER audit_stock_movements_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_transaction('STOCK_MOVEMENT');

-- Aplicar auditoria em financial_entries
DROP TRIGGER IF EXISTS audit_financial_entries_trigger ON public.financial_entries;
CREATE TRIGGER audit_financial_entries_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_transaction('FINANCIAL_ENTRY');

-- Aplicar auditoria em caixa_movimentacoes
DROP TRIGGER IF EXISTS audit_caixa_movimentacoes_trigger ON public.caixa_movimentacoes;
CREATE TRIGGER audit_caixa_movimentacoes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.caixa_movimentacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_transaction('CASH_MOVEMENT');

-- Adicionar comentários
COMMENT ON TABLE public.transaction_audit IS 'Tabela de auditoria para rastreamento de transações críticas do sistema';
COMMENT ON FUNCTION public.validate_caixa_movimentacao() IS 'Validação de segurança para movimentações de caixa';
COMMENT ON FUNCTION public.validate_stock_movement() IS 'Validação de segurança para movimentações de estoque';
COMMENT ON FUNCTION public.audit_transaction() IS 'Função genérica de auditoria para transações críticas';