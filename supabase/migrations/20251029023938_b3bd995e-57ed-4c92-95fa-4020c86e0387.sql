-- Criar movimento de estoque faltante para o pedido 2
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
  'Saída automática - Pedido ' || o.order_number,
  o.owner_id
FROM orders o
INNER JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = 'fe63040f-375e-427a-a245-ca7d46654368'
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements sm
    WHERE sm.reference_type = 'order'
      AND sm.reference_id = o.id
      AND sm.product_id = oi.product_id
  );

-- Verificar se o trigger existe e está ativo
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgname = 'trigger_sync_stock_from_order';

-- Recriar o trigger com a lógica correta
DROP TRIGGER IF EXISTS trigger_sync_stock_from_order ON orders;

CREATE OR REPLACE FUNCTION sync_stock_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Processar quando o pedido for concluído (completed) E pago (paid)
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' AND 
     (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Para cada item do pedido
    FOR v_item IN 
      SELECT pi.product_id, pi.quantity, p.track_stock
      FROM order_items pi
      INNER JOIN products p ON p.id = pi.product_id
      WHERE pi.order_id = NEW.id AND p.track_stock = true
    LOOP
      -- Verificar se já existe movimento para este item
      IF NOT EXISTS (
        SELECT 1 FROM stock_movements 
        WHERE reference_type = 'order' 
          AND reference_id = NEW.id 
          AND product_id = v_item.product_id
      ) THEN
        -- Criar movimento de estoque de saída
        INSERT INTO stock_movements (
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
          (SELECT id FROM warehouses WHERE org_id = NEW.org_id AND is_active = true LIMIT 1),
          'out',
          v_item.quantity,
          'order',
          NEW.id,
          'Saída automática - Pedido ' || NEW.order_number,
          NEW.owner_id
        );
      END IF;
    END LOOP;
    
    -- Log de sincronização
    PERFORM create_sync_log(
      NEW.org_id,
      'order_to_stock',
      'orders',
      NEW.id,
      'stock_movements',
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_stock_from_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_from_order();

COMMENT ON TRIGGER trigger_sync_stock_from_order ON orders IS 'Sincroniza estoque automaticamente quando pedido é completado e pago - REFORÇADO em 2025-10-29';
COMMENT ON FUNCTION sync_stock_from_order() IS 'Cria movimentos de estoque para saída quando pedido é completado e pago';