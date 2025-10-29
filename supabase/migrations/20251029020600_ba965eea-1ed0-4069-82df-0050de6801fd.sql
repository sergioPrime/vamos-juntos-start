-- AUDITORIA E CORREÇÃO DO MÓDULO DE ESTOQUE
-- Corrigir triggers duplicados e inconsistências

-- 1. REMOVER TRIGGERS DUPLICADOS DE AUDITORIA
DROP TRIGGER IF EXISTS audit_stock_movements_changes ON stock_movements;

-- 2. REMOVER TRIGGER DE VALIDAÇÃO DUPLICADO
DROP TRIGGER IF EXISTS validate_stock_movement_trigger ON stock_movements;

-- 3. AJUSTAR ESTOQUE DO PRODUTO FANTA LATA 200ML (corrigir inconsistência)
-- Estoque calculado correto: 10 unidades
UPDATE products 
SET stock_quantity = 10
WHERE sku = '004' AND name = 'FANTA LATA 200ML';

-- 4. ADICIONAR COMENTÁRIOS NOS TRIGGERS PARA DOCUMENTAÇÃO
COMMENT ON TRIGGER trigger_sync_stock_after_insert ON stock_movements IS 
  'Sincroniza automaticamente o estoque do produto após inserção de movimento';

COMMENT ON TRIGGER trigger_validate_stock_before_insert ON stock_movements IS 
  'Valida estoque disponível antes de permitir saídas';

COMMENT ON TRIGGER trigger_validate_warehouse_in_movement ON stock_movements IS 
  'Valida se o depósito está ativo antes de permitir movimento';

COMMENT ON TRIGGER audit_stock_movements_trigger ON stock_movements IS 
  'Registra auditoria de todas as movimentações de estoque';

-- 5. CRIAR VIEW PARA MONITORAMENTO DE INTEGRIDADE DO ESTOQUE
CREATE OR REPLACE VIEW stock_integrity_check AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.stock_quantity as registered_stock,
  COALESCE(SUM(
    CASE 
      WHEN sm.movement_type = 'in' THEN sm.quantity
      WHEN sm.movement_type = 'out' THEN -sm.quantity
      ELSE 0
    END
  ), 0) as calculated_stock,
  ABS(p.stock_quantity - COALESCE(SUM(
    CASE 
      WHEN sm.movement_type = 'in' THEN sm.quantity
      WHEN sm.movement_type = 'out' THEN -sm.quantity
      ELSE 0
    END
  ), 0)) as difference,
  CASE 
    WHEN ABS(p.stock_quantity - COALESCE(SUM(
      CASE 
        WHEN sm.movement_type = 'in' THEN sm.quantity
        WHEN sm.movement_type = 'out' THEN -sm.quantity
        ELSE 0
      END
    ), 0)) > 0.01 THEN 'INCONSISTENT'
    ELSE 'OK'
  END as status
FROM products p
LEFT JOIN stock_movements sm ON sm.product_id = p.id
WHERE p.track_stock = true
GROUP BY p.id, p.name, p.sku, p.stock_quantity
ORDER BY difference DESC;