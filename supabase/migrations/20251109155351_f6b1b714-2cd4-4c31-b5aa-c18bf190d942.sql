-- Create blockchain records table for immutable audit trail
CREATE TABLE IF NOT EXISTS public.blockchain_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  block_number BIGSERIAL NOT NULL,
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'financial', 'stock', 'fiscal', 'order', 'purchase'
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  data_snapshot JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_blockchain_org_id ON public.blockchain_records(org_id);
CREATE INDEX idx_blockchain_block_number ON public.blockchain_records(block_number);
CREATE INDEX idx_blockchain_transaction_type ON public.blockchain_records(transaction_type);
CREATE INDEX idx_blockchain_timestamp ON public.blockchain_records(timestamp DESC);
CREATE INDEX idx_blockchain_record_id ON public.blockchain_records(record_id);

-- Composite index for chain validation
CREATE INDEX idx_blockchain_chain ON public.blockchain_records(org_id, block_number);

-- Enable RLS
ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view blockchain records from their organization"
  ON public.blockchain_records FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Only system can insert blockchain records (via functions)
CREATE POLICY "System can insert blockchain records"
  ON public.blockchain_records FOR INSERT
  WITH CHECK (true);

-- Function to generate blockchain hash
CREATE OR REPLACE FUNCTION public.generate_blockchain_hash(
  p_block_number BIGINT,
  p_previous_hash TEXT,
  p_transaction_type TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_data_snapshot JSONB,
  p_timestamp TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash_input TEXT;
BEGIN
  -- Concatenate all data for hashing
  v_hash_input := p_block_number::TEXT || 
                  p_previous_hash || 
                  p_transaction_type || 
                  p_table_name || 
                  p_record_id::TEXT || 
                  p_data_snapshot::TEXT || 
                  p_timestamp::TEXT;
  
  -- Generate SHA-256 hash
  RETURN encode(digest(v_hash_input, 'sha256'), 'hex');
END;
$$;

-- Function to get last blockchain hash for organization
CREATE OR REPLACE FUNCTION public.get_last_blockchain_hash(p_org_id UUID)
RETURNS TABLE(block_number BIGINT, current_hash TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT br.block_number, br.current_hash
  FROM public.blockchain_records br
  WHERE br.org_id = p_org_id
  ORDER BY br.block_number DESC
  LIMIT 1;
END;
$$;

-- Function to add blockchain record
CREATE OR REPLACE FUNCTION public.add_blockchain_record(
  p_org_id UUID,
  p_transaction_type TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_data_snapshot JSONB,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_hash TEXT;
  v_block_number BIGINT;
  v_current_hash TEXT;
  v_timestamp TIMESTAMPTZ;
  v_new_id UUID;
BEGIN
  v_timestamp := now();
  
  -- Get last block hash
  SELECT lbh.current_hash, lbh.block_number
  INTO v_previous_hash, v_block_number
  FROM public.get_last_blockchain_hash(p_org_id) lbh;
  
  -- If no previous block (genesis block)
  IF v_previous_hash IS NULL THEN
    v_previous_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    v_block_number := 0;
  END IF;
  
  -- Increment block number
  v_block_number := v_block_number + 1;
  
  -- Generate current hash
  v_current_hash := public.generate_blockchain_hash(
    v_block_number,
    v_previous_hash,
    p_transaction_type,
    p_table_name,
    p_record_id,
    p_data_snapshot,
    v_timestamp
  );
  
  -- Insert blockchain record
  INSERT INTO public.blockchain_records (
    org_id,
    block_number,
    previous_hash,
    current_hash,
    transaction_type,
    table_name,
    record_id,
    data_snapshot,
    user_id,
    timestamp
  ) VALUES (
    p_org_id,
    v_block_number,
    v_previous_hash,
    v_current_hash,
    p_transaction_type,
    p_table_name,
    p_record_id,
    p_data_snapshot,
    p_user_id,
    v_timestamp
  ) RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;

-- Function to validate blockchain integrity
CREATE OR REPLACE FUNCTION public.validate_blockchain_chain(p_org_id UUID)
RETURNS TABLE(
  is_valid BOOLEAN,
  total_blocks BIGINT,
  invalid_blocks BIGINT,
  first_invalid_block BIGINT,
  validation_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_expected_hash TEXT;
  v_invalid_count BIGINT := 0;
  v_first_invalid BIGINT := NULL;
  v_total_count BIGINT;
BEGIN
  -- Count total blocks
  SELECT COUNT(*) INTO v_total_count
  FROM public.blockchain_records
  WHERE org_id = p_org_id;
  
  -- Validate each block
  FOR v_record IN
    SELECT * FROM public.blockchain_records
    WHERE org_id = p_org_id
    ORDER BY block_number ASC
  LOOP
    -- Generate expected hash
    v_expected_hash := public.generate_blockchain_hash(
      v_record.block_number,
      v_record.previous_hash,
      v_record.transaction_type,
      v_record.table_name,
      v_record.record_id,
      v_record.data_snapshot,
      v_record.timestamp
    );
    
    -- Check if hash matches
    IF v_expected_hash != v_record.current_hash THEN
      v_invalid_count := v_invalid_count + 1;
      IF v_first_invalid IS NULL THEN
        v_first_invalid := v_record.block_number;
      END IF;
      
      -- Mark block as invalid
      UPDATE public.blockchain_records
      SET is_valid = false
      WHERE id = v_record.id;
    ELSE
      -- Mark block as valid
      UPDATE public.blockchain_records
      SET is_valid = true
      WHERE id = v_record.id;
    END IF;
  END LOOP;
  
  -- Return validation results
  is_valid := (v_invalid_count = 0);
  total_blocks := v_total_count;
  invalid_blocks := v_invalid_count;
  first_invalid_block := v_first_invalid;
  
  IF is_valid THEN
    validation_message := 'Blockchain íntegra. Todos os blocos são válidos.';
  ELSE
    validation_message := format('Blockchain comprometida. %s bloco(s) inválido(s) detectado(s).', v_invalid_count);
  END IF;
  
  RETURN NEXT;
END;
$$;

-- Trigger function to add blockchain record for financial entries
CREATE OR REPLACE FUNCTION public.blockchain_financial_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.add_blockchain_record(
      NEW.org_id,
      'financial',
      'financial_entries',
      NEW.id,
      row_to_json(NEW)::JSONB,
      COALESCE(auth.uid(), NEW.created_by)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for stock movements
CREATE OR REPLACE FUNCTION public.blockchain_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.add_blockchain_record(
      NEW.org_id,
      'stock',
      'stock_movements',
      NEW.id,
      row_to_json(NEW)::JSONB,
      COALESCE(auth.uid(), NEW.created_by)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for orders
CREATE OR REPLACE FUNCTION public.blockchain_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.payment_status != OLD.payment_status) THEN
    PERFORM public.add_blockchain_record(
      NEW.org_id,
      'order',
      'orders',
      NEW.id,
      row_to_json(NEW)::JSONB,
      COALESCE(auth.uid(), NEW.owner_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers to critical tables
CREATE TRIGGER trigger_blockchain_financial_entry
  AFTER INSERT OR UPDATE ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.blockchain_financial_entry();

CREATE TRIGGER trigger_blockchain_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.blockchain_stock_movement();

CREATE TRIGGER trigger_blockchain_order
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.blockchain_order();

-- Create blockchain statistics view
CREATE OR REPLACE VIEW public.blockchain_statistics AS
SELECT 
  org_id,
  COUNT(*) as total_blocks,
  COUNT(*) FILTER (WHERE is_valid = true) as valid_blocks,
  COUNT(*) FILTER (WHERE is_valid = false) as invalid_blocks,
  MIN(timestamp) as first_block_date,
  MAX(timestamp) as last_block_date,
  COUNT(DISTINCT transaction_type) as transaction_types,
  COUNT(DISTINCT user_id) as unique_users
FROM public.blockchain_records
GROUP BY org_id;