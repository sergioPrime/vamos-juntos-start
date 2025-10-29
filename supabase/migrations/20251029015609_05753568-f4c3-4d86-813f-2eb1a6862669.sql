-- Atualizar trigger de sincronização de estoque para incluir pedidos 'completed'
-- Isso é necessário porque vendas do PDV são criadas diretamente como 'completed'

CREATE OR REPLACE FUNCTION sync_stock_from_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Só sincroniza quando pedido é confirmado, em processamento ou completado
  IF (NEW.status IN ('confirmed', 'processing', 'completed')) AND 
     (OLD IS NULL OR OLD.status NOT IN ('confirmed', 'processing', 'completed')) THEN
    
    -- Criar movimentos de estoque para cada item do pedido
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
      NEW.org_id,
      oi.product_id,
      'out',
      oi.quantity,
      'order',
      NEW.id,
      'Saída automática - Pedido ' || COALESCE(NEW.order_number, NEW.id::text),
      NEW.owner_id
    FROM order_items oi
    INNER JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id
      AND p.track_stock = true
      -- Evitar duplicação: só criar se não existir movimento para este pedido
      AND NOT EXISTS (
        SELECT 1 FROM stock_movements sm
        WHERE sm.reference_type = 'order'
          AND sm.reference_id = NEW.id
          AND sm.product_id = oi.product_id
      );
    
    -- Registrar log de sincronização
    PERFORM create_sync_log(
      NEW.org_id,
      'order_to_stock',
      NEW.id,
      'orders',
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;