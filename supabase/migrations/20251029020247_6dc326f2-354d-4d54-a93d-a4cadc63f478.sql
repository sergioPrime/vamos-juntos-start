-- Remover os triggers duplicados que causam atualização dupla do estoque
-- Identificados: update_stock_on_movement e update_product_stock_trigger

DROP TRIGGER IF EXISTS update_stock_on_movement ON stock_movements;
DROP TRIGGER IF EXISTS update_product_stock_trigger ON stock_movements;
DROP FUNCTION IF EXISTS update_product_stock() CASCADE;

-- Garantir que apenas o trigger correto (sync_product_stock_quantity) existe
DROP TRIGGER IF EXISTS trigger_sync_stock_after_insert ON stock_movements;

CREATE TRIGGER trigger_sync_stock_after_insert
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_stock_quantity();