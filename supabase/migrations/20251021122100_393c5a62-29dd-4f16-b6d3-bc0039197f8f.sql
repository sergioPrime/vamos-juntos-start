-- Sprint 3.1: Sistema de Sincronização Automática
-- Adiciona triggers e funções para sincronização automática de dados entre módulos

-- Tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_table TEXT,
  target_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT sync_logs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_sync_logs_org_id ON public.sync_logs(org_id);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);
CREATE INDEX idx_sync_logs_source ON public.sync_logs(source_table, source_id);

-- RLS para sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs from their organization"
  ON public.sync_logs FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.user_organizations 
    WHERE user_id = auth.uid()
  ));

-- Função para criar log de sincronização
CREATE OR REPLACE FUNCTION public.create_sync_log(
  p_org_id UUID,
  p_sync_type TEXT,
  p_source_table TEXT,
  p_source_id UUID,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.sync_logs (
    org_id,
    sync_type,
    source_table,
    source_id,
    target_table,
    target_id,
    status
  ) VALUES (
    p_org_id,
    p_sync_type,
    p_source_table,
    p_source_id,
    p_target_table,
    p_target_id,
    'completed'
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Função para sincronizar estoque ao criar pedido
CREATE OR REPLACE FUNCTION public.sync_stock_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
BEGIN
  -- Apenas processar quando o pedido for confirmado
  IF NEW.status IN ('confirmed', 'processing') AND (OLD.status IS NULL OR OLD.status NOT IN ('confirmed', 'processing')) THEN
    
    -- Para cada item do pedido
    FOR v_item IN 
      SELECT * FROM public.order_items WHERE order_id = NEW.id
    LOOP
      -- Buscar informações do produto
      SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id;
      
      IF v_product.track_stock THEN
        -- Criar movimento de estoque de saída
        INSERT INTO public.stock_movements (
          org_id,
          product_id,
          warehouse_id,
          movement_type,
          quantity,
          reference_type,
          reference_id,
          notes,
          created_by
        ) VALUES (
          NEW.org_id,
          v_item.product_id,
          (SELECT id FROM public.warehouses WHERE org_id = NEW.org_id AND is_active = true LIMIT 1),
          'out',
          v_item.quantity,
          'order',
          NEW.id,
          'Saída automática - Pedido #' || NEW.order_number,
          NEW.owner_id
        );
        
        -- Log de sincronização
        PERFORM public.create_sync_log(
          NEW.org_id,
          'order_to_stock',
          'orders',
          NEW.id,
          'stock_movements',
          NULL
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para sincronizar estoque quando pedido for confirmado
DROP TRIGGER IF EXISTS trigger_sync_stock_from_order ON public.orders;
CREATE TRIGGER trigger_sync_stock_from_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_stock_from_order();

-- Função para sincronizar lançamento financeiro ao quitar pedido
CREATE OR REPLACE FUNCTION public.sync_financial_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar lançamento financeiro quando pedido for pago
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status <> 'paid') THEN
    
    -- Verificar se já existe lançamento para este pedido
    IF NOT EXISTS (
      SELECT 1 FROM public.financial_entries 
      WHERE origin_id = NEW.id AND origin_type = 'order'
    ) THEN
      -- Criar lançamento a receber
      INSERT INTO public.financial_entries (
        org_id,
        company_id,
        entry_type,
        person_type,
        person_id,
        amount,
        description,
        competence_date,
        due_date,
        origin_type,
        origin_id,
        is_settled,
        settled_at,
        payment_method_id,
        created_by
      ) VALUES (
        NEW.org_id,
        (SELECT id FROM public.companies WHERE org_id = NEW.org_id AND is_default = true LIMIT 1),
        'receivable',
        'customer',
        NEW.customer_id,
        NEW.total_amount,
        'Recebimento - Pedido #' || NEW.order_number,
        NEW.order_date::DATE,
        NEW.order_date::DATE,
        'order',
        NEW.id,
        true,
        now(),
        (SELECT id FROM public.payment_methods WHERE org_id = NEW.org_id AND code = '001' LIMIT 1),
        NEW.owner_id
      );
      
      -- Log de sincronização
      PERFORM public.create_sync_log(
        NEW.org_id,
        'order_to_financial',
        'orders',
        NEW.id,
        'financial_entries',
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para sincronizar financeiro quando pedido for pago
DROP TRIGGER IF EXISTS trigger_sync_financial_from_order ON public.orders;
CREATE TRIGGER trigger_sync_financial_from_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_financial_from_order();

-- Função para sincronizar estoque ao receber compra
CREATE OR REPLACE FUNCTION public.sync_stock_from_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Processar quando a compra for recebida
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status <> 'received') THEN
    
    -- Para cada item da compra
    FOR v_item IN 
      SELECT * FROM public.purchase_items WHERE purchase_id = NEW.id
    LOOP
      -- Criar movimento de estoque de entrada
      INSERT INTO public.stock_movements (
        org_id,
        product_id,
        warehouse_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_by
      ) VALUES (
        NEW.org_id,
        v_item.product_id,
        (SELECT id FROM public.warehouses WHERE org_id = NEW.org_id AND is_active = true LIMIT 1),
        'in',
        v_item.quantity,
        'purchase',
        NEW.id,
        'Entrada automática - Compra #' || NEW.purchase_number,
        auth.uid()
      );
    END LOOP;
    
    -- Log de sincronização
    PERFORM public.create_sync_log(
      NEW.org_id,
      'purchase_to_stock',
      'purchases',
      NEW.id,
      'stock_movements',
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para sincronizar estoque quando compra for recebida
DROP TRIGGER IF EXISTS trigger_sync_stock_from_purchase ON public.purchases;
CREATE TRIGGER trigger_sync_stock_from_purchase
  AFTER INSERT OR UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_stock_from_purchase();

-- Função para sincronizar transação bancária ao quitar parcela
CREATE OR REPLACE FUNCTION public.sync_transaction_from_installment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
BEGIN
  -- Criar transação bancária quando parcela for quitada
  IF NEW.is_settled = true AND (OLD.is_settled IS NULL OR OLD.is_settled = false) 
     AND NEW.bank_account_id IS NOT NULL THEN
    
    -- Buscar dados do lançamento
    SELECT * INTO v_entry FROM public.financial_entries WHERE id = NEW.entry_id;
    
    -- Criar transação bancária
    INSERT INTO public.financial_transactions (
      org_id,
      company_id,
      bank_account_id,
      transaction_type,
      amount,
      transaction_date,
      description,
      reference_type,
      reference_id,
      created_by
    ) VALUES (
      NEW.org_id,
      v_entry.company_id,
      NEW.bank_account_id,
      CASE 
        WHEN v_entry.entry_type = 'receivable' THEN 'inflow'
        ELSE 'outflow'
      END,
      COALESCE(NEW.settled_amount, NEW.amount),
      NEW.settled_at::DATE,
      'Parcela ' || NEW.installment_number || '/' || NEW.total_installments || 
        CASE 
          WHEN NEW.late_fee > 0 OR NEW.interest_amount > 0 THEN 
            ' (com encargos)'
          WHEN NEW.discount_amount > 0 THEN 
            ' (com desconto)'
          ELSE ''
        END,
      'installment',
      NEW.id,
      auth.uid()
    );
    
    -- Log de sincronização
    PERFORM public.create_sync_log(
      NEW.org_id,
      'installment_to_transaction',
      'financial_entry_installments',
      NEW.id,
      'financial_transactions',
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para sincronizar transação ao quitar parcela
DROP TRIGGER IF EXISTS trigger_sync_transaction_from_installment ON public.financial_entry_installments;
CREATE TRIGGER trigger_sync_transaction_from_installment
  AFTER INSERT OR UPDATE ON public.financial_entry_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transaction_from_installment();

-- Função para obter estatísticas de sincronização
CREATE OR REPLACE FUNCTION public.get_sync_statistics(
  p_org_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  sync_type TEXT,
  total_syncs BIGINT,
  successful_syncs BIGINT,
  failed_syncs BIGINT,
  success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.sync_type,
    COUNT(*)::BIGINT as total_syncs,
    COUNT(*) FILTER (WHERE sl.status = 'completed')::BIGINT as successful_syncs,
    COUNT(*) FILTER (WHERE sl.status = 'failed')::BIGINT as failed_syncs,
    ROUND(
      (COUNT(*) FILTER (WHERE sl.status = 'completed')::NUMERIC / 
       NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 
      2
    ) as success_rate
  FROM public.sync_logs sl
  WHERE sl.org_id = p_org_id
    AND sl.created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  GROUP BY sl.sync_type
  ORDER BY total_syncs DESC;
END;
$$;

-- Comentários
COMMENT ON TABLE public.sync_logs IS 'Logs de sincronização automática entre módulos';
COMMENT ON FUNCTION public.sync_stock_from_order() IS 'Sincroniza estoque automaticamente quando pedido é confirmado';
COMMENT ON FUNCTION public.sync_financial_from_order() IS 'Cria lançamento financeiro quando pedido é pago';
COMMENT ON FUNCTION public.sync_stock_from_purchase() IS 'Sincroniza estoque automaticamente quando compra é recebida';
COMMENT ON FUNCTION public.sync_transaction_from_installment() IS 'Cria transação bancária quando parcela é quitada';
COMMENT ON FUNCTION public.get_sync_statistics(UUID, INTEGER) IS 'Retorna estatísticas de sincronização';