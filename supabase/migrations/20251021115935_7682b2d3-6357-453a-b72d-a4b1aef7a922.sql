-- Sprint 2.2: Juros, Multas e Descontos
-- Sistema de cálculo automático de encargos financeiros

-- Adicionar campos de configuração na tabela de organizações
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS default_late_fee_percentage NUMERIC DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS default_daily_interest_percentage NUMERIC DEFAULT 0.033,
ADD COLUMN IF NOT EXISTS default_early_discount_percentage NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS default_early_discount_days INTEGER DEFAULT 0;

-- Adicionar campos de encargos na tabela de parcelas
ALTER TABLE public.financial_entry_installments
ADD COLUMN IF NOT EXISTS late_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS interest_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_amount NUMERIC DEFAULT 0;

-- Função para calcular encargos de uma parcela
CREATE OR REPLACE FUNCTION public.calculate_installment_charges(
  p_installment_id UUID,
  p_payment_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  original_amount NUMERIC,
  late_fee NUMERIC,
  interest_amount NUMERIC,
  discount_amount NUMERIC,
  final_amount NUMERIC,
  days_late INTEGER,
  days_early INTEGER
) AS $$
DECLARE
  v_installment RECORD;
  v_org_config RECORD;
  v_days_diff INTEGER;
  v_late_fee NUMERIC := 0;
  v_interest NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_final NUMERIC;
BEGIN
  -- Busca dados da parcela
  SELECT i.*, e.org_id
  INTO v_installment
  FROM public.financial_entry_installments i
  JOIN public.financial_entries e ON e.id = i.entry_id
  WHERE i.id = p_installment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parcela não encontrada';
  END IF;

  -- Busca configurações da organização
  SELECT 
    COALESCE(default_late_fee_percentage, 2.00) as late_fee_pct,
    COALESCE(default_daily_interest_percentage, 0.033) as daily_interest_pct,
    COALESCE(default_early_discount_percentage, 0.00) as early_discount_pct,
    COALESCE(default_early_discount_days, 0) as early_discount_days
  INTO v_org_config
  FROM public.organizations
  WHERE id = v_installment.org_id;

  -- Calcula diferença de dias
  v_days_diff := p_payment_date - v_installment.due_date;

  -- Se pagamento atrasado
  IF v_days_diff > 0 THEN
    -- Calcula multa
    v_late_fee := ROUND(v_installment.amount * (v_org_config.late_fee_pct / 100), 2);
    
    -- Calcula juros
    v_interest := ROUND(
      v_installment.amount * (v_org_config.daily_interest_pct / 100) * v_days_diff,
      2
    );
    
    v_discount := 0;
    days_late := v_days_diff;
    days_early := 0;
  
  -- Se pagamento antecipado
  ELSIF v_days_diff < 0 AND ABS(v_days_diff) <= v_org_config.early_discount_days THEN
    v_late_fee := 0;
    v_interest := 0;
    
    -- Calcula desconto
    v_discount := ROUND(
      v_installment.amount * (v_org_config.early_discount_pct / 100),
      2
    );
    
    days_late := 0;
    days_early := ABS(v_days_diff);
  
  -- Pagamento em dia
  ELSE
    v_late_fee := 0;
    v_interest := 0;
    v_discount := 0;
    days_late := 0;
    days_early := 0;
  END IF;

  -- Calcula valor final
  v_final := v_installment.amount + v_late_fee + v_interest - v_discount;

  -- Retorna resultados
  original_amount := v_installment.amount;
  late_fee := v_late_fee;
  interest_amount := v_interest;
  discount_amount := v_discount;
  final_amount := v_final;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para quitar parcela com cálculo automático de encargos
CREATE OR REPLACE FUNCTION public.settle_installment_with_charges(
  p_installment_id UUID,
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_payment_method_id UUID DEFAULT NULL,
  p_bank_account_id UUID DEFAULT NULL,
  p_custom_amount NUMERIC DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  original_amount NUMERIC,
  late_fee NUMERIC,
  interest_amount NUMERIC,
  discount_amount NUMERIC,
  final_amount NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_charges RECORD;
  v_entry_id UUID;
  v_all_settled BOOLEAN;
  v_amount_to_settle NUMERIC;
BEGIN
  -- Calcula encargos
  SELECT * INTO v_charges
  FROM public.calculate_installment_charges(p_installment_id, p_payment_date);

  -- Define valor a quitar (customizado ou calculado)
  v_amount_to_settle := COALESCE(p_custom_amount, v_charges.final_amount);

  -- Atualiza a parcela
  UPDATE public.financial_entry_installments
  SET 
    is_settled = true,
    settled_at = p_payment_date,
    settled_amount = v_amount_to_settle,
    late_fee = v_charges.late_fee,
    interest_amount = v_charges.interest_amount,
    discount_amount = v_charges.discount_amount,
    final_amount = v_charges.final_amount,
    payment_method_id = p_payment_method_id,
    bank_account_id = p_bank_account_id,
    updated_at = now()
  WHERE id = p_installment_id
  RETURNING entry_id INTO v_entry_id;

  IF NOT FOUND THEN
    success := false;
    message := 'Parcela não encontrada';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Verifica se todas as parcelas estão quitadas
  SELECT NOT EXISTS(
    SELECT 1 FROM public.financial_entry_installments
    WHERE entry_id = v_entry_id AND is_settled = false
  ) INTO v_all_settled;

  -- Se todas quitadas, marca o lançamento como quitado
  IF v_all_settled THEN
    UPDATE public.financial_entries
    SET 
      is_settled = true,
      settled_at = p_payment_date,
      updated_at = now()
    WHERE id = v_entry_id;
  END IF;

  -- Retorna resultado
  success := true;
  original_amount := v_charges.original_amount;
  late_fee := v_charges.late_fee;
  interest_amount := v_charges.interest_amount;
  discount_amount := v_charges.discount_amount;
  final_amount := v_charges.final_amount;
  message := 'Parcela quitada com sucesso';

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para simular pagamento (sem salvar)
CREATE OR REPLACE FUNCTION public.simulate_installment_payment(
  p_installment_id UUID,
  p_payment_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  installment_number INTEGER,
  due_date DATE,
  payment_date DATE,
  original_amount NUMERIC,
  late_fee NUMERIC,
  interest_amount NUMERIC,
  discount_amount NUMERIC,
  final_amount NUMERIC,
  days_late INTEGER,
  days_early INTEGER,
  total_charges NUMERIC,
  total_discount NUMERIC
) AS $$
DECLARE
  v_installment RECORD;
  v_charges RECORD;
BEGIN
  -- Busca dados da parcela
  SELECT * INTO v_installment
  FROM public.financial_entry_installments
  WHERE id = p_installment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parcela não encontrada';
  END IF;

  -- Calcula encargos
  SELECT * INTO v_charges
  FROM public.calculate_installment_charges(p_installment_id, p_payment_date);

  -- Retorna simulação
  installment_number := v_installment.installment_number;
  due_date := v_installment.due_date;
  payment_date := p_payment_date;
  original_amount := v_charges.original_amount;
  late_fee := v_charges.late_fee;
  interest_amount := v_charges.interest_amount;
  discount_amount := v_charges.discount_amount;
  final_amount := v_charges.final_amount;
  days_late := v_charges.days_late;
  days_early := v_charges.days_early;
  total_charges := v_charges.late_fee + v_charges.interest_amount;
  total_discount := v_charges.discount_amount;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter parcelas vencidas com encargos
CREATE OR REPLACE FUNCTION public.get_overdue_installments_with_charges(
  p_org_id UUID,
  p_reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  installment_id UUID,
  entry_id UUID,
  installment_number INTEGER,
  total_installments INTEGER,
  due_date DATE,
  days_overdue INTEGER,
  original_amount NUMERIC,
  late_fee NUMERIC,
  interest_amount NUMERIC,
  final_amount NUMERIC,
  person_name TEXT,
  entry_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as installment_id,
    i.entry_id,
    i.installment_number,
    i.total_installments,
    i.due_date,
    (p_reference_date - i.due_date)::INTEGER as days_overdue,
    c.original_amount,
    c.late_fee,
    c.interest_amount,
    c.final_amount,
    CASE 
      WHEN e.person_type = 'customer' THEN cust.name
      WHEN e.person_type = 'supplier' THEN supp.name
      ELSE 'Desconhecido'
    END as person_name,
    e.entry_type
  FROM public.financial_entry_installments i
  JOIN public.financial_entries e ON e.id = i.entry_id
  LEFT JOIN public.customers cust ON cust.id = e.person_id AND e.person_type = 'customer'
  LEFT JOIN public.suppliers supp ON supp.id = e.person_id AND e.person_type = 'supplier'
  CROSS JOIN LATERAL public.calculate_installment_charges(i.id, p_reference_date) c
  WHERE i.org_id = p_org_id
    AND i.is_settled = false
    AND i.due_date < p_reference_date
  ORDER BY i.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para configurar taxas da organização
CREATE OR REPLACE FUNCTION public.update_organization_financial_config(
  p_org_id UUID,
  p_late_fee_percentage NUMERIC DEFAULT NULL,
  p_daily_interest_percentage NUMERIC DEFAULT NULL,
  p_early_discount_percentage NUMERIC DEFAULT NULL,
  p_early_discount_days INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.organizations
  SET
    default_late_fee_percentage = COALESCE(p_late_fee_percentage, default_late_fee_percentage),
    default_daily_interest_percentage = COALESCE(p_daily_interest_percentage, default_daily_interest_percentage),
    default_early_discount_percentage = COALESCE(p_early_discount_percentage, default_early_discount_percentage),
    default_early_discount_days = COALESCE(p_early_discount_days, default_early_discount_days),
    updated_at = now()
  WHERE id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organização não encontrada';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_installments_overdue 
ON public.financial_entry_installments(org_id, due_date) 
WHERE is_settled = false;

CREATE INDEX IF NOT EXISTS idx_installments_settlement_date 
ON public.financial_entry_installments(settled_at) 
WHERE is_settled = true;