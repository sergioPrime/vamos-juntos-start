-- Sprint 1.1: Transações Atômicas para Operações de Estoque
-- Função para transferência atômica de estoque entre armazéns

CREATE OR REPLACE FUNCTION stock_transfer_atomic(
  p_org_id UUID,
  p_product_id UUID,
  p_warehouse_from UUID,
  p_warehouse_to UUID,
  p_quantity NUMERIC,
  p_lot_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_available_stock NUMERIC;
  v_exit_movement_id UUID;
  v_entry_movement_id UUID;
  v_result JSON;
BEGIN
  -- Validar estoque disponível
  SELECT COALESCE(SUM(
    CASE 
      WHEN movement_type = 'in' THEN quantity
      WHEN movement_type = 'out' THEN -quantity
      ELSE 0
    END
  ), 0)
  INTO v_available_stock
  FROM stock_movements
  WHERE org_id = p_org_id
    AND product_id = p_product_id
    AND warehouse_id = p_warehouse_from
    AND (p_lot_id IS NULL OR lot_id = p_lot_id);

  -- Verificar se há estoque suficiente
  IF v_available_stock < p_quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', v_available_stock, p_quantity;
  END IF;

  -- Criar movimento de saída
  INSERT INTO stock_movements (
    org_id,
    product_id,
    warehouse_id,
    lot_id,
    movement_type,
    quantity,
    reason,
    notes,
    created_by,
    reference_type,
    created_at
  ) VALUES (
    p_org_id,
    p_product_id,
    p_warehouse_from,
    p_lot_id,
    'out',
    p_quantity,
    COALESCE(p_reason, 'Transferência entre armazéns'),
    p_notes,
    p_created_by,
    'transfer',
    NOW()
  ) RETURNING id INTO v_exit_movement_id;

  -- Criar movimento de entrada
  INSERT INTO stock_movements (
    org_id,
    product_id,
    warehouse_id,
    lot_id,
    movement_type,
    quantity,
    reason,
    notes,
    created_by,
    reference_type,
    reference_id,
    created_at
  ) VALUES (
    p_org_id,
    p_product_id,
    p_warehouse_to,
    p_lot_id,
    'in',
    p_quantity,
    COALESCE(p_reason, 'Transferência entre armazéns'),
    p_notes,
    p_created_by,
    'transfer',
    v_exit_movement_id,
    NOW()
  ) RETURNING id INTO v_entry_movement_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'exit_movement_id', v_exit_movement_id,
    'entry_movement_id', v_entry_movement_id,
    'quantity_transferred', p_quantity
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro na transferência: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para saída de estoque com validação atômica
CREATE OR REPLACE FUNCTION stock_exit_with_validation(
  p_org_id UUID,
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity NUMERIC,
  p_lot_id UUID DEFAULT NULL,
  p_exit_type TEXT DEFAULT 'sale',
  p_reason TEXT DEFAULT NULL,
  p_destination TEXT DEFAULT NULL,
  p_reference_document TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_available_stock NUMERIC;
  v_movement_id UUID;
  v_product_name TEXT;
  v_result JSON;
BEGIN
  -- Buscar nome do produto
  SELECT name INTO v_product_name
  FROM products
  WHERE id = p_product_id AND org_id = p_org_id;

  IF v_product_name IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

  -- Validar estoque disponível
  IF p_warehouse_id IS NOT NULL THEN
    -- Verificar estoque específico do armazém
    SELECT COALESCE(SUM(
      CASE 
        WHEN movement_type = 'in' THEN quantity
        WHEN movement_type = 'out' THEN -quantity
        ELSE 0
      END
    ), 0)
    INTO v_available_stock
    FROM stock_movements
    WHERE org_id = p_org_id
      AND product_id = p_product_id
      AND warehouse_id = p_warehouse_id
      AND (p_lot_id IS NULL OR lot_id = p_lot_id);
  ELSE
    -- Verificar estoque total
    SELECT COALESCE(SUM(
      CASE 
        WHEN movement_type = 'in' THEN quantity
        WHEN movement_type = 'out' THEN -quantity
        ELSE 0
      END
    ), 0)
    INTO v_available_stock
    FROM stock_movements
    WHERE org_id = p_org_id
      AND product_id = p_product_id
      AND (p_lot_id IS NULL OR lot_id = p_lot_id);
  END IF;

  -- Verificar se há estoque suficiente
  IF v_available_stock < p_quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente para "%". Disponível: %, Solicitado: %', 
      v_product_name, v_available_stock, p_quantity;
  END IF;

  -- Criar movimento de saída
  INSERT INTO stock_movements (
    org_id,
    product_id,
    warehouse_id,
    lot_id,
    movement_type,
    quantity,
    reason,
    notes,
    created_by,
    reference_type,
    reference_document,
    created_at
  ) VALUES (
    p_org_id,
    p_product_id,
    p_warehouse_id,
    p_lot_id,
    'out',
    p_quantity,
    COALESCE(p_reason, 'Saída de estoque - ' || p_exit_type),
    COALESCE(p_notes, '') || 
      CASE WHEN p_destination IS NOT NULL THEN ' | Destino: ' || p_destination ELSE '' END,
    p_created_by,
    p_exit_type,
    p_reference_document,
    NOW()
  ) RETURNING id INTO v_movement_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'quantity_exited', p_quantity,
    'remaining_stock', v_available_stock - p_quantity
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro na saída de estoque: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para entrada de estoque atômica
CREATE OR REPLACE FUNCTION stock_entry_atomic(
  p_org_id UUID,
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity NUMERIC,
  p_lot_id UUID DEFAULT NULL,
  p_entry_type TEXT DEFAULT 'purchase',
  p_reason TEXT DEFAULT NULL,
  p_unit_cost NUMERIC DEFAULT NULL,
  p_total_cost NUMERIC DEFAULT NULL,
  p_supplier_id UUID DEFAULT NULL,
  p_reference_document TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_movement_id UUID;
  v_result JSON;
BEGIN
  -- Criar movimento de entrada
  INSERT INTO stock_movements (
    org_id,
    product_id,
    warehouse_id,
    lot_id,
    movement_type,
    quantity,
    reason,
    notes,
    created_by,
    reference_type,
    reference_document,
    created_at
  ) VALUES (
    p_org_id,
    p_product_id,
    p_warehouse_id,
    p_lot_id,
    'in',
    p_quantity,
    COALESCE(p_reason, 'Entrada de estoque - ' || p_entry_type),
    COALESCE(p_notes, '') || 
      CASE WHEN p_unit_cost IS NOT NULL THEN ' | Custo unitário: R$ ' || p_unit_cost::TEXT ELSE '' END ||
      CASE WHEN p_total_cost IS NOT NULL THEN ' | Custo total: R$ ' || p_total_cost::TEXT ELSE '' END,
    p_created_by,
    p_entry_type,
    p_reference_document,
    NOW()
  ) RETURNING id INTO v_movement_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'quantity_entered', p_quantity
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro na entrada de estoque: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;