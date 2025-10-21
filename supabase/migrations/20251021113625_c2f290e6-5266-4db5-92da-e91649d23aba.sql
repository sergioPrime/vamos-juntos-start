-- ============================================
-- SPRINT 1.1: VALIDAÇÃO E SINCRONIZAÇÃO DE ESTOQUE
-- ============================================

-- Function to update product stock_quantity based on stock movements
CREATE OR REPLACE FUNCTION sync_product_stock_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if product_id exists
  IF NEW.product_id IS NOT NULL THEN
    -- Calculate new stock based on movement type
    IF NEW.movement_type = 'in' THEN
      -- Add stock (entry, transfer in, purchase receipt, adjustment positive)
      UPDATE products
      SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
          updated_at = now()
      WHERE id = NEW.product_id;
      
    ELSIF NEW.movement_type = 'out' THEN
      -- Subtract stock (exit, transfer out, sale, adjustment negative)
      UPDATE products
      SET stock_quantity = COALESCE(stock_quantity, 0) - NEW.quantity,
          updated_at = now()
      WHERE id = NEW.product_id;
      
    ELSIF NEW.movement_type = 'adjustment' THEN
      -- For adjustments, set the exact quantity
      UPDATE products
      SET stock_quantity = NEW.quantity,
          updated_at = now()
      WHERE id = NEW.product_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync stock after insert
DROP TRIGGER IF EXISTS trigger_sync_stock_after_insert ON stock_movements;
CREATE TRIGGER trigger_sync_stock_after_insert
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_stock_quantity();

-- Function to validate stock before creating movement
CREATE OR REPLACE FUNCTION validate_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock numeric;
  v_product_name text;
  v_track_stock boolean;
BEGIN
  -- Only validate for OUT movements
  IF NEW.movement_type = 'out' AND NEW.product_id IS NOT NULL THEN
    -- Get current stock and check if product tracks stock
    SELECT stock_quantity, name, track_stock
    INTO v_current_stock, v_product_name, v_track_stock
    FROM products
    WHERE id = NEW.product_id;
    
    -- Only validate if product tracks stock
    IF v_track_stock THEN
      -- Check if there's enough stock
      IF COALESCE(v_current_stock, 0) < NEW.quantity THEN
        RAISE EXCEPTION 'Estoque insuficiente para o produto "%". Disponível: %, Solicitado: %',
          v_product_name,
          COALESCE(v_current_stock, 0),
          NEW.quantity;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate stock before insert
DROP TRIGGER IF EXISTS trigger_validate_stock_before_insert ON stock_movements;
CREATE TRIGGER trigger_validate_stock_before_insert
  BEFORE INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock_movement();

-- Function to check low stock levels
CREATE OR REPLACE FUNCTION check_low_stock_alert()
RETURNS TABLE (
  product_id uuid,
  product_name text,
  current_stock numeric,
  min_stock numeric,
  reorder_point numeric,
  org_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.stock_quantity,
    p.min_stock_level,
    p.reorder_point,
    p.org_id
  FROM products p
  WHERE p.track_stock = true
    AND p.active = true
    AND (
      (p.min_stock_level IS NOT NULL AND p.stock_quantity <= p.min_stock_level)
      OR (p.reorder_point IS NOT NULL AND p.stock_quantity <= p.reorder_point)
    )
  ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get stock by warehouse
CREATE OR REPLACE FUNCTION get_warehouse_stock(p_product_id uuid, p_warehouse_id uuid)
RETURNS numeric AS $$
DECLARE
  v_stock numeric;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN movement_type = 'in' THEN quantity
      WHEN movement_type = 'out' THEN -quantity
      ELSE 0
    END
  ), 0)
  INTO v_stock
  FROM stock_movements
  WHERE product_id = p_product_id
    AND warehouse_id = p_warehouse_id;
    
  RETURN v_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for better performance on stock queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_warehouse 
  ON stock_movements(product_id, warehouse_id);

CREATE INDEX IF NOT EXISTS idx_products_stock_tracking 
  ON products(org_id, track_stock, active) 
  WHERE track_stock = true AND active = true;

CREATE INDEX IF NOT EXISTS idx_products_low_stock 
  ON products(org_id, stock_quantity, min_stock_level) 
  WHERE track_stock = true AND active = true;

-- Add comment to document the system
COMMENT ON FUNCTION sync_product_stock_quantity() IS 
  'Automatically syncs product stock_quantity based on stock_movements. Triggered after INSERT on stock_movements.';

COMMENT ON FUNCTION validate_stock_movement() IS 
  'Validates stock availability before creating OUT movements. Prevents negative stock for products that track inventory.';

COMMENT ON FUNCTION check_low_stock_alert() IS 
  'Returns products with stock levels below minimum or reorder point. Used for inventory alerts.';

COMMENT ON FUNCTION get_warehouse_stock(uuid, uuid) IS 
  'Calculates current stock for a specific product in a specific warehouse based on stock movements.';