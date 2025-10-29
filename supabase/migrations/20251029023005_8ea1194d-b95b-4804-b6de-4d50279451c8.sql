-- Corrigir movimento de estoque faltante e ajustar o trigger

-- 1. Criar movimento de estoque para o pedido que foi feito sem movimento
INSERT INTO stock_movements (
  org_id,
  product_id,
  movement_type,
  quantity,
  reference_type,
  reference_id,
  notes,
  created_by
)
SELECT 
  o.org_id,
  oi.product_id,
  'out',
  oi.quantity,
  'order',
  o.id,
  'Saída automática - Pedido ' || o.order_number || ' (correção retroativa)',
  o.owner_id
FROM orders o
INNER JOIN order_items oi ON oi.order_id = o.id
INNER JOIN products p ON p.id = oi.product_id
WHERE o.org_id = '3f4bd408-ed6f-4f6a-aec4-8276a8153a98'
  AND o.status = 'completed'
  AND o.created_at > NOW() - INTERVAL '24 hours'
  AND p.track_stock = true
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements sm
    WHERE sm.reference_type = 'order'
      AND sm.reference_id = o.id
      AND sm.product_id = oi.product_id
  );

-- 2. Verificar e ativar o trigger se não estiver ativo
DROP TRIGGER IF EXISTS trigger_sync_stock_from_order ON orders;

CREATE TRIGGER trigger_sync_stock_from_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_from_order();

COMMENT ON TRIGGER trigger_sync_stock_from_order ON orders IS 'Sincroniza movimentos de estoque automaticamente quando pedido é confirmado/processado/completado - CORRIGIDO em 2025-10-29';