-- Sprint 1.2: Validação FIFO de Lotes
-- Sistema automático de First In, First Out para controle de lotes

-- Função para sugerir lote automaticamente seguindo FIFO
CREATE OR REPLACE FUNCTION suggest_lot_fifo(
  p_org_id UUID,
  p_product_id UUID,
  p_warehouse_id UUID DEFAULT NULL,
  p_required_quantity NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  lot_id UUID,
  lot_number TEXT,
  available_quantity NUMERIC,
  manufacturing_date DATE,
  expiration_date DATE,
  days_until_expiration INTEGER,
  suggested_quantity NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH lot_stock AS (
    SELECT 
      lm.id,
      lm.lot_number,
      lm.manufacturing_date,
      lm.expiration_date,
      COALESCE(SUM(
        CASE 
          WHEN sm.movement_type = 'in' THEN sm.quantity
          WHEN sm.movement_type = 'out' THEN -sm.quantity
          ELSE 0
        END
      ), 0) as current_stock,
      CASE 
        WHEN lm.expiration_date IS NOT NULL THEN 
          lm.expiration_date - CURRENT_DATE
        ELSE NULL
      END as days_until_exp
    FROM lot_management lm
    LEFT JOIN stock_movements sm ON sm.lot_id = lm.id
    WHERE lm.org_id = p_org_id
      AND lm.product_id = p_product_id
      AND lm.status = 'active'
      AND (p_warehouse_id IS NULL OR sm.warehouse_id = p_warehouse_id)
    GROUP BY lm.id, lm.lot_number, lm.manufacturing_date, lm.expiration_date
    HAVING COALESCE(SUM(
      CASE 
        WHEN sm.movement_type = 'in' THEN sm.quantity
        WHEN sm.movement_type = 'out' THEN -sm.quantity
        ELSE 0
      END
    ), 0) > 0
  )
  SELECT 
    ls.id,
    ls.lot_number,
    ls.current_stock,
    ls.manufacturing_date,
    ls.expiration_date,
    ls.days_until_exp::INTEGER,
    CASE 
      WHEN p_required_quantity IS NULL THEN ls.current_stock
      WHEN p_required_quantity <= ls.current_stock THEN p_required_quantity
      ELSE ls.current_stock
    END as suggested_qty
  FROM lot_stock ls
  ORDER BY 
    -- Prioridade 1: Lotes próximos ao vencimento (menos de 30 dias)
    CASE WHEN ls.days_until_exp IS NOT NULL AND ls.days_until_exp < 30 THEN 0 ELSE 1 END,
    -- Prioridade 2: Data de fabricação mais antiga (FIFO)
    ls.manufacturing_date ASC NULLS LAST,
    -- Prioridade 3: Data de vencimento mais próxima
    ls.expiration_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar se a saída está seguindo FIFO
CREATE OR REPLACE FUNCTION validate_lot_fifo(
  p_org_id UUID,
  p_product_id UUID,
  p_lot_id UUID,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_suggested_lot UUID;
  v_suggested_lot_number TEXT;
  v_selected_lot_date DATE;
  v_is_fifo_compliant BOOLEAN;
  v_warning_message TEXT;
  v_result JSON;
BEGIN
  -- Buscar data de fabricação do lote selecionado
  SELECT manufacturing_date INTO v_selected_lot_date
  FROM lot_management
  WHERE id = p_lot_id AND org_id = p_org_id;

  -- Buscar lote sugerido pelo FIFO
  SELECT lot_id, lot_number INTO v_suggested_lot, v_suggested_lot_number
  FROM suggest_lot_fifo(p_org_id, p_product_id, p_warehouse_id, NULL)
  LIMIT 1;

  -- Verificar se está seguindo FIFO
  v_is_fifo_compliant := (v_suggested_lot = p_lot_id OR v_suggested_lot IS NULL);

  -- Criar mensagem de aviso se não estiver seguindo FIFO
  IF NOT v_is_fifo_compliant THEN
    v_warning_message := format(
      'Atenção: O lote sugerido pelo FIFO é "%s". O lote selecionado pode não seguir a ordem ideal de saída.',
      v_suggested_lot_number
    );
  END IF;

  -- Construir resultado
  v_result := json_build_object(
    'is_fifo_compliant', v_is_fifo_compliant,
    'suggested_lot_id', v_suggested_lot,
    'suggested_lot_number', v_suggested_lot_number,
    'selected_lot_manufacturing_date', v_selected_lot_date,
    'warning_message', v_warning_message
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter alertas de lotes próximos ao vencimento
CREATE OR REPLACE FUNCTION get_expiring_lots_alert(
  p_org_id UUID,
  p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE (
  lot_id UUID,
  lot_number TEXT,
  product_id UUID,
  product_name TEXT,
  warehouse_id UUID,
  warehouse_name TEXT,
  available_quantity NUMERIC,
  expiration_date DATE,
  days_until_expiration INTEGER,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH lot_stock AS (
    SELECT 
      lm.id,
      lm.lot_number,
      lm.product_id,
      lm.expiration_date,
      sm.warehouse_id,
      COALESCE(SUM(
        CASE 
          WHEN sm.movement_type = 'in' THEN sm.quantity
          WHEN sm.movement_type = 'out' THEN -sm.quantity
          ELSE 0
        END
      ), 0) as current_stock,
      (lm.expiration_date - CURRENT_DATE) as days_until_exp
    FROM lot_management lm
    INNER JOIN stock_movements sm ON sm.lot_id = lm.id
    WHERE lm.org_id = p_org_id
      AND lm.status = 'active'
      AND lm.expiration_date IS NOT NULL
      AND lm.expiration_date <= CURRENT_DATE + p_days_threshold
    GROUP BY lm.id, lm.lot_number, lm.product_id, lm.expiration_date, sm.warehouse_id
    HAVING COALESCE(SUM(
      CASE 
        WHEN sm.movement_type = 'in' THEN sm.quantity
        WHEN sm.movement_type = 'out' THEN -sm.quantity
        ELSE 0
      END
    ), 0) > 0
  )
  SELECT 
    ls.id,
    ls.lot_number,
    ls.product_id,
    p.name as product_name,
    ls.warehouse_id,
    w.name as warehouse_name,
    ls.current_stock,
    ls.expiration_date,
    ls.days_until_exp::INTEGER,
    CASE 
      WHEN ls.days_until_exp <= 0 THEN 'critical'
      WHEN ls.days_until_exp <= 7 THEN 'high'
      WHEN ls.days_until_exp <= 15 THEN 'medium'
      ELSE 'low'
    END as severity
  FROM lot_stock ls
  INNER JOIN products p ON p.id = ls.product_id
  LEFT JOIN warehouses w ON w.id = ls.warehouse_id
  ORDER BY ls.days_until_exp ASC, ls.current_stock DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para auto-sugerir lotes em múltiplas quantidades (para pedidos com múltiplos itens)
CREATE OR REPLACE FUNCTION auto_allocate_lots(
  p_org_id UUID,
  p_product_id UUID,
  p_required_quantity NUMERIC,
  p_warehouse_id UUID DEFAULT NULL
)
RETURNS TABLE (
  lot_id UUID,
  lot_number TEXT,
  allocated_quantity NUMERIC,
  manufacturing_date DATE,
  expiration_date DATE
) AS $$
DECLARE
  v_remaining_quantity NUMERIC := p_required_quantity;
  v_lot_record RECORD;
BEGIN
  -- Iterar pelos lotes sugeridos pelo FIFO até completar a quantidade
  FOR v_lot_record IN 
    SELECT * FROM suggest_lot_fifo(p_org_id, p_product_id, p_warehouse_id, NULL)
  LOOP
    IF v_remaining_quantity <= 0 THEN
      EXIT;
    END IF;

    lot_id := v_lot_record.lot_id;
    lot_number := v_lot_record.lot_number;
    manufacturing_date := v_lot_record.manufacturing_date;
    expiration_date := v_lot_record.expiration_date;
    
    IF v_lot_record.available_quantity >= v_remaining_quantity THEN
      allocated_quantity := v_remaining_quantity;
      v_remaining_quantity := 0;
    ELSE
      allocated_quantity := v_lot_record.available_quantity;
      v_remaining_quantity := v_remaining_quantity - v_lot_record.available_quantity;
    END IF;

    RETURN NEXT;
  END LOOP;

  -- Se ainda faltar quantidade, retornar erro
  IF v_remaining_quantity > 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente. Faltam % unidades.', v_remaining_quantity;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;