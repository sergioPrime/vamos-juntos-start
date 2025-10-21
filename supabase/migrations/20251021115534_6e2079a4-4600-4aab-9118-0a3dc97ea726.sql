-- Sprint 2.1: Sistema de Parcelas
-- Tabela para armazenar as parcelas dos lançamentos financeiros

CREATE TABLE IF NOT EXISTS public.financial_entry_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  entry_id UUID NOT NULL REFERENCES public.financial_entries(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  settled_amount NUMERIC,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  CONSTRAINT valid_installment_number CHECK (installment_number > 0 AND installment_number <= total_installments),
  CONSTRAINT valid_settled_data CHECK (
    (is_settled = false AND settled_at IS NULL AND settled_amount IS NULL) OR
    (is_settled = true AND settled_at IS NOT NULL AND settled_amount IS NOT NULL)
  )
);

-- Índices para performance
CREATE INDEX idx_installments_entry_id ON public.financial_entry_installments(entry_id);
CREATE INDEX idx_installments_org_id ON public.financial_entry_installments(org_id);
CREATE INDEX idx_installments_due_date ON public.financial_entry_installments(due_date);
CREATE INDEX idx_installments_is_settled ON public.financial_entry_installments(is_settled);

-- RLS Policies
ALTER TABLE public.financial_entry_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage installments from their organization"
ON public.financial_entry_installments
FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- Função para gerar parcelas automaticamente
CREATE OR REPLACE FUNCTION public.generate_installments(
  p_entry_id UUID,
  p_num_installments INTEGER,
  p_first_due_date DATE,
  p_total_amount NUMERIC,
  p_org_id UUID,
  p_created_by UUID
)
RETURNS TABLE(
  installment_number INTEGER,
  due_date DATE,
  amount NUMERIC
) AS $$
DECLARE
  v_installment_amount NUMERIC;
  v_remaining_amount NUMERIC;
  v_current_due_date DATE;
BEGIN
  -- Calcula valor base da parcela
  v_installment_amount := ROUND(p_total_amount / p_num_installments, 2);
  v_remaining_amount := p_total_amount;
  v_current_due_date := p_first_due_date;

  -- Gera as parcelas
  FOR i IN 1..p_num_installments LOOP
    -- Última parcela ajusta diferença de arredondamento
    IF i = p_num_installments THEN
      v_installment_amount := v_remaining_amount;
    END IF;

    -- Insere a parcela
    INSERT INTO public.financial_entry_installments (
      org_id,
      entry_id,
      installment_number,
      total_installments,
      due_date,
      amount,
      created_by
    ) VALUES (
      p_org_id,
      p_entry_id,
      i,
      p_num_installments,
      v_current_due_date,
      v_installment_amount,
      p_created_by
    );

    -- Retorna info da parcela
    installment_number := i;
    due_date := v_current_due_date;
    amount := v_installment_amount;
    RETURN NEXT;

    -- Prepara próxima iteração
    v_remaining_amount := v_remaining_amount - v_installment_amount;
    v_current_due_date := v_current_due_date + INTERVAL '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para quitar parcela
CREATE OR REPLACE FUNCTION public.settle_installment(
  p_installment_id UUID,
  p_settled_amount NUMERIC,
  p_payment_method_id UUID DEFAULT NULL,
  p_bank_account_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_entry_id UUID;
  v_all_settled BOOLEAN;
BEGIN
  -- Quita a parcela
  UPDATE public.financial_entry_installments
  SET 
    is_settled = true,
    settled_at = now(),
    settled_amount = p_settled_amount,
    payment_method_id = p_payment_method_id,
    bank_account_id = p_bank_account_id,
    updated_at = now()
  WHERE id = p_installment_id
  RETURNING entry_id INTO v_entry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parcela não encontrada';
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
      settled_at = now(),
      updated_at = now()
    WHERE id = v_entry_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para cancelar quitação de parcela
CREATE OR REPLACE FUNCTION public.unsettle_installment(
  p_installment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  -- Remove quitação da parcela
  UPDATE public.financial_entry_installments
  SET 
    is_settled = false,
    settled_at = NULL,
    settled_amount = NULL,
    payment_method_id = NULL,
    bank_account_id = NULL,
    updated_at = now()
  WHERE id = p_installment_id
  RETURNING entry_id INTO v_entry_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parcela não encontrada';
  END IF;

  -- Remove quitação do lançamento principal
  UPDATE public.financial_entries
  SET 
    is_settled = false,
    settled_at = NULL,
    updated_at = now()
  WHERE id = v_entry_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter resumo de parcelas de um lançamento
CREATE OR REPLACE FUNCTION public.get_installments_summary(
  p_entry_id UUID
)
RETURNS TABLE(
  total_installments INTEGER,
  settled_installments INTEGER,
  pending_installments INTEGER,
  total_amount NUMERIC,
  settled_amount NUMERIC,
  pending_amount NUMERIC,
  next_due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_installments,
    COUNT(*) FILTER (WHERE is_settled = true)::INTEGER as settled_installments,
    COUNT(*) FILTER (WHERE is_settled = false)::INTEGER as pending_installments,
    SUM(amount) as total_amount,
    COALESCE(SUM(settled_amount) FILTER (WHERE is_settled = true), 0) as settled_amount,
    SUM(amount) FILTER (WHERE is_settled = false) as pending_amount,
    MIN(due_date) FILTER (WHERE is_settled = false) as next_due_date
  FROM public.financial_entry_installments
  WHERE entry_id = p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_installment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_installment_updated_at
BEFORE UPDATE ON public.financial_entry_installments
FOR EACH ROW
EXECUTE FUNCTION public.update_installment_updated_at();

-- Validação: não permitir deletar parcelas quitadas
CREATE OR REPLACE FUNCTION public.prevent_settled_installment_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_settled = true THEN
    RAISE EXCEPTION 'Não é possível excluir parcela quitada. Cancele a quitação primeiro.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_settled_installment_deletion
BEFORE DELETE ON public.financial_entry_installments
FOR EACH ROW
EXECUTE FUNCTION public.prevent_settled_installment_deletion();