-- Ensure integrity of associations between chart_of_accounts and cost_centers
-- 1) Unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_cacc_account_center
ON public.chart_account_cost_centers(chart_of_account_id, cost_center_id);

-- 2) Foreign keys for referential integrity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cacc_account' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chart_account_cost_centers
    ADD CONSTRAINT fk_cacc_account
    FOREIGN KEY (chart_of_account_id)
    REFERENCES public.chart_of_accounts(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_cacc_center' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chart_account_cost_centers
    ADD CONSTRAINT fk_cacc_center
    FOREIGN KEY (cost_center_id)
    REFERENCES public.cost_centers(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Validation function to enforce business rules at DB level
CREATE OR REPLACE FUNCTION public.validate_chart_account_cost_centers()
RETURNS trigger AS $$
DECLARE
  acc_type text;
  acc_active boolean;
  acc_org uuid;
  cc_active boolean;
  cc_org uuid;
BEGIN
  -- Validate account exists and is analytic + active
  SELECT account_type, is_active, org_id INTO acc_type, acc_active, acc_org
  FROM public.chart_of_accounts WHERE id = NEW.chart_of_account_id;
  IF acc_type IS NULL THEN
    RAISE EXCEPTION 'Conta contábil inexistente';
  END IF;
  IF acc_type <> 'analytic' THEN
    RAISE EXCEPTION 'Apenas contas analíticas podem ter centros de custo associados';
  END IF;
  IF NOT acc_active THEN
    RAISE EXCEPTION 'Conta contábil deve estar ativa para associar centros de custo';
  END IF;

  -- Validate cost center exists and is active
  SELECT is_active, org_id INTO cc_active, cc_org
  FROM public.cost_centers WHERE id = NEW.cost_center_id;
  IF cc_active IS NULL THEN
    RAISE EXCEPTION 'Centro de custo inexistente';
  END IF;
  IF NOT cc_active THEN
    RAISE EXCEPTION 'Centro de custo deve estar ativo para ser associado';
  END IF;

  -- Must belong to the same organization
  IF acc_org <> cc_org THEN
    RAISE EXCEPTION 'Conta e Centro de Custo devem pertencer à mesma organização';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4) Trigger for the association table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_cacc') THEN
    CREATE TRIGGER trg_validate_cacc
    BEFORE INSERT OR UPDATE ON public.chart_account_cost_centers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_chart_account_cost_centers();
  END IF;
END $$;

-- 5) Cleanup functions to auto-remove associations when making accounts/centers inactive or synthetic
CREATE OR REPLACE FUNCTION public.cleanup_cacc_on_account_update()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- If account becomes synthetic or inactive, remove associations
    IF (OLD.account_type = 'analytic' AND NEW.account_type = 'synthetic') OR (OLD.is_active = true AND NEW.is_active = false) THEN
      DELETE FROM public.chart_account_cost_centers WHERE chart_of_account_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cleanup_cacc_on_account_update') THEN
    CREATE TRIGGER trg_cleanup_cacc_on_account_update
    AFTER UPDATE ON public.chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_cacc_on_account_update();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cleanup_cacc_on_cost_center_update()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    DELETE FROM public.chart_account_cost_centers WHERE cost_center_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cleanup_cacc_on_cc_update') THEN
    CREATE TRIGGER trg_cleanup_cacc_on_cc_update
    AFTER UPDATE ON public.cost_centers
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_cacc_on_cost_center_update();
  END IF;
END $$;

-- 6) Wire existing validation functions (if not already) and updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_chart_of_accounts') THEN
    CREATE TRIGGER trg_validate_chart_of_accounts
    BEFORE INSERT OR UPDATE ON public.chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_chart_of_accounts();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_cost_centers') THEN
    CREATE TRIGGER trg_validate_cost_centers
    BEFORE INSERT OR UPDATE ON public.cost_centers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_cost_centers();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_financial_entries') THEN
    CREATE TRIGGER trg_validate_financial_entries
    BEFORE INSERT OR UPDATE ON public.financial_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_financial_entries();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_updated_at_chart_of_accounts') THEN
    CREATE TRIGGER trg_updated_at_chart_of_accounts
    BEFORE UPDATE ON public.chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_updated_at_cost_centers') THEN
    CREATE TRIGGER trg_updated_at_cost_centers
    BEFORE UPDATE ON public.cost_centers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_updated_at_cacc') THEN
    CREATE TRIGGER trg_updated_at_cacc
    BEFORE UPDATE ON public.chart_account_cost_centers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
