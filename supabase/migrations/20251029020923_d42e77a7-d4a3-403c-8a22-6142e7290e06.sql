-- AUDITORIA E CORREÇÃO DO MÓDULO DE VENDAS

-- 1. REMOVER TRIGGER DUPLICADO DE AUDITORIA
-- Temos dois triggers fazendo auditoria da mesma tabela:
-- audit_orders_changes e audit_orders_trigger

DROP TRIGGER IF EXISTS audit_orders_changes ON orders;

-- Manter apenas audit_orders_trigger que é o padrão

-- 2. ADICIONAR COMENTÁRIOS NOS TRIGGERS PARA DOCUMENTAÇÃO
COMMENT ON TRIGGER set_order_number_trigger ON orders IS 
  'Gera automaticamente o número sequencial do pedido na criação';

COMMENT ON TRIGGER trigger_validate_customer_in_order ON orders IS 
  'Valida se o cliente existe e está ativo antes de criar/atualizar pedido';

COMMENT ON TRIGGER trigger_sync_stock_from_order ON orders IS 
  'Cria movimentações de estoque automaticamente quando pedido é confirmado/processado/completado';

COMMENT ON TRIGGER trigger_sync_financial_from_order ON orders IS 
  'Cria lançamento financeiro automaticamente quando pedido é marcado como pago';

COMMENT ON TRIGGER audit_orders_trigger ON orders IS 
  'Registra auditoria de todas as operações em pedidos (PDV e gestão de vendas)';

COMMENT ON TRIGGER update_orders_updated_at ON orders IS 
  'Atualiza automaticamente o campo updated_at em modificações';

COMMENT ON TRIGGER trigger_validate_product_in_order_item ON order_items IS 
  'Valida se o produto existe e está ativo antes de adicionar ao pedido';

-- 3. CRIAR VIEW PARA MONITORAMENTO DE INTEGRIDADE DE VENDAS
CREATE OR REPLACE VIEW sales_integrity_check AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.payment_status,
  o.total_amount as declared_total,
  COALESCE(SUM(oi.total_price), 0) as calculated_total,
  ABS(o.total_amount - COALESCE(SUM(oi.total_price), 0)) as value_difference,
  COUNT(oi.id) as items_count,
  COUNT(sm.id) as stock_movements_count,
  COUNT(fe.id) as financial_entries_count,
  CASE 
    WHEN COUNT(oi.id) = 0 THEN 'NO_ITEMS'
    WHEN ABS(o.total_amount - COALESCE(SUM(oi.total_price), 0)) > 0.01 THEN 'VALUE_MISMATCH'
    WHEN o.status IN ('completed', 'confirmed', 'processing') AND COUNT(sm.id) = 0 THEN 'NO_STOCK_MOVEMENT'
    WHEN o.payment_status = 'paid' AND COUNT(fe.id) = 0 THEN 'NO_FINANCIAL_ENTRY'
    ELSE 'OK'
  END as status_check,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN stock_movements sm ON sm.reference_type = 'order' AND sm.reference_id = o.id
LEFT JOIN financial_entries fe ON fe.origin_type = 'order' AND fe.origin_id = o.id
WHERE o.created_at > NOW() - INTERVAL '30 days'
GROUP BY o.id, o.order_number, o.status, o.payment_status, o.total_amount, o.created_at
ORDER BY o.created_at DESC;

-- 4. CRIAR VIEW PARA ESTATÍSTICAS DE SINCRONIZAÇÃO
CREATE OR REPLACE VIEW sales_sync_statistics AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status IN ('completed', 'confirmed', 'processing')) as processed_orders,
  COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_orders,
  COUNT(DISTINCT CASE WHEN sm.id IS NOT NULL THEN o.id END) as orders_with_stock_sync,
  COUNT(DISTINCT CASE WHEN fe.id IS NOT NULL THEN o.id END) as orders_with_financial_sync,
  ROUND(
    COUNT(DISTINCT CASE WHEN sm.id IS NOT NULL THEN o.id END)::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'confirmed', 'processing')), 0) * 100,
    2
  ) as stock_sync_percentage,
  ROUND(
    COUNT(DISTINCT CASE WHEN fe.id IS NOT NULL THEN o.id END)::NUMERIC / 
    NULLIF(COUNT(*) FILTER (WHERE payment_status = 'paid'), 0) * 100,
    2
  ) as financial_sync_percentage
FROM orders o
LEFT JOIN stock_movements sm ON sm.reference_type = 'order' AND sm.reference_id = o.id
LEFT JOIN financial_entries fe ON fe.origin_type = 'order' AND fe.origin_id = o.id
WHERE o.created_at > NOW() - INTERVAL '30 days';