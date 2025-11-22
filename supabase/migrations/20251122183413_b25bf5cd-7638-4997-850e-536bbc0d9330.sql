-- NFC-e Contingency Mode Support
-- Adds offline queue and synchronization capabilities

-- Add contingency mode fields to fiscal_config
ALTER TABLE public.fiscal_config
ADD COLUMN IF NOT EXISTS contingencia_ativa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_contingencia text,
ADD COLUMN IF NOT EXISTS data_inicio_contingencia timestamptz;

-- Create contingency queue table
CREATE TABLE IF NOT EXISTS public.nfce_contingency_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nfce_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  retry_count integer DEFAULT 0,
  last_retry_at timestamptz,
  transmitted_at timestamptz,
  CONSTRAINT nfce_contingency_queue_status_check 
    CHECK (status IN ('pending', 'processing', 'transmitted', 'failed'))
);

-- Create index for queue processing
CREATE INDEX IF NOT EXISTS idx_nfce_contingency_queue_org_status 
  ON public.nfce_contingency_queue(org_id, status);

CREATE INDEX IF NOT EXISTS idx_nfce_contingency_queue_created_at 
  ON public.nfce_contingency_queue(created_at);

-- RLS Policies for contingency queue
ALTER TABLE public.nfce_contingency_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org contingency queue"
  ON public.nfce_contingency_queue
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into their org contingency queue"
  ON public.nfce_contingency_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org contingency queue"
  ON public.nfce_contingency_queue
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Function to activate contingency mode
CREATE OR REPLACE FUNCTION public.activate_nfce_contingency(
  p_org_id uuid,
  p_motivo text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.fiscal_config
  SET 
    contingencia_ativa = true,
    motivo_contingencia = p_motivo,
    data_inicio_contingencia = now()
  WHERE org_id = p_org_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- Function to deactivate contingency mode
CREATE OR REPLACE FUNCTION public.deactivate_nfce_contingency(
  p_org_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.fiscal_config
  SET 
    contingencia_ativa = false,
    motivo_contingencia = null,
    data_inicio_contingencia = null
  WHERE org_id = p_org_id AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- Function to get pending contingency items
CREATE OR REPLACE FUNCTION public.get_pending_contingency_nfce(
  p_org_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  nfce_data jsonb,
  created_at timestamptz,
  retry_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.nfce_data,
    q.created_at,
    q.retry_count
  FROM public.nfce_contingency_queue q
  WHERE q.org_id = p_org_id
    AND q.status = 'pending'
  ORDER BY q.created_at ASC
  LIMIT p_limit;
END;
$$;

-- Function to mark contingency item as transmitted
CREATE OR REPLACE FUNCTION public.mark_contingency_transmitted(
  p_queue_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.nfce_contingency_queue
  SET 
    status = 'transmitted',
    transmitted_at = now()
  WHERE id = p_queue_id;
  
  RETURN FOUND;
END;
$$;

-- Function to mark contingency item as failed
CREATE OR REPLACE FUNCTION public.mark_contingency_failed(
  p_queue_id uuid,
  p_error_message text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.nfce_contingency_queue
  SET 
    status = 'failed',
    error_message = p_error_message,
    retry_count = retry_count + 1,
    last_retry_at = now()
  WHERE id = p_queue_id;
  
  RETURN FOUND;
END;
$$;

COMMENT ON TABLE public.nfce_contingency_queue IS 'Queue for NFC-e documents pending transmission in contingency mode';
COMMENT ON FUNCTION public.activate_nfce_contingency IS 'Activates contingency mode for NFC-e emission';
COMMENT ON FUNCTION public.deactivate_nfce_contingency IS 'Deactivates contingency mode and returns to normal operation';
COMMENT ON FUNCTION public.get_pending_contingency_nfce IS 'Gets pending NFC-e documents from contingency queue';