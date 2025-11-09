-- Create blockchain alerts table
CREATE TABLE IF NOT EXISTS public.blockchain_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'invalid_block', 'chain_compromised', 'validation_failed'
  severity TEXT NOT NULL DEFAULT 'high', -- 'low', 'medium', 'high', 'critical'
  block_id UUID REFERENCES public.blockchain_records(id),
  block_number BIGINT,
  message TEXT NOT NULL,
  details JSONB,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_blockchain_alerts_org_id ON public.blockchain_alerts(org_id);
CREATE INDEX idx_blockchain_alerts_severity ON public.blockchain_alerts(severity);
CREATE INDEX idx_blockchain_alerts_is_read ON public.blockchain_alerts(is_read);
CREATE INDEX idx_blockchain_alerts_created_at ON public.blockchain_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.blockchain_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view alerts from their organization"
  ON public.blockchain_alerts FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update alerts"
  ON public.blockchain_alerts FOR UPDATE
  USING (
    org_id IN (
      SELECT uo.org_id FROM public.user_organizations uo
      JOIN public.user_roles ur ON ur.user_id = uo.user_id
      WHERE uo.user_id = auth.uid() 
        AND ur.role IN ('admin', 'superadmin')
    )
  );

-- Function to create blockchain alert
CREATE OR REPLACE FUNCTION public.create_blockchain_alert(
  p_org_id UUID,
  p_alert_type TEXT,
  p_severity TEXT,
  p_block_id UUID,
  p_block_number BIGINT,
  p_message TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  -- Insert alert
  INSERT INTO public.blockchain_alerts (
    org_id,
    alert_type,
    severity,
    block_id,
    block_number,
    message,
    details
  ) VALUES (
    p_org_id,
    p_alert_type,
    p_severity,
    p_block_id,
    p_block_number,
    p_message,
    p_details
  ) RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- Function to trigger email notification
CREATE OR REPLACE FUNCTION public.notify_blockchain_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_emails TEXT[];
BEGIN
  -- Get admin emails for the organization
  SELECT array_agg(DISTINCT p.email)
  INTO v_admin_emails
  FROM public.profiles p
  JOIN public.user_organizations uo ON uo.user_id = p.id
  JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE uo.org_id = NEW.org_id
    AND ur.role IN ('admin', 'superadmin')
    AND p.email IS NOT NULL;
  
  -- Call edge function to send email (async, non-blocking)
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-blockchain-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'alert_id', NEW.id,
      'org_id', NEW.org_id,
      'alert_type', NEW.alert_type,
      'severity', NEW.severity,
      'block_number', NEW.block_number,
      'message', NEW.message,
      'admin_emails', v_admin_emails
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send blockchain alert notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger to send notifications for critical alerts
CREATE TRIGGER trigger_notify_blockchain_alert
  AFTER INSERT ON public.blockchain_alerts
  FOR EACH ROW
  WHEN (NEW.severity IN ('high', 'critical'))
  EXECUTE FUNCTION public.notify_blockchain_alert();

-- Function to detect invalid blocks and create alerts
CREATE OR REPLACE FUNCTION public.detect_invalid_blocks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_exists BOOLEAN;
BEGIN
  -- Only process if block became invalid
  IF NEW.is_valid = false AND (OLD.is_valid = true OR OLD.is_valid IS NULL) THEN
    
    -- Check if alert already exists for this block
    SELECT EXISTS(
      SELECT 1 FROM public.blockchain_alerts
      WHERE block_id = NEW.id
        AND alert_type = 'invalid_block'
        AND is_resolved = false
    ) INTO v_alert_exists;
    
    -- Create alert if it doesn't exist
    IF NOT v_alert_exists THEN
      PERFORM public.create_blockchain_alert(
        NEW.org_id,
        'invalid_block',
        'critical',
        NEW.id,
        NEW.block_number,
        format('Bloco #%s detectado como inválido! Possível adulteração de dados.', NEW.block_number),
        jsonb_build_object(
          'transaction_type', NEW.transaction_type,
          'table_name', NEW.table_name,
          'record_id', NEW.record_id,
          'current_hash', NEW.current_hash,
          'timestamp', NEW.timestamp
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to detect invalid blocks
CREATE TRIGGER trigger_detect_invalid_blocks
  AFTER UPDATE ON public.blockchain_records
  FOR EACH ROW
  WHEN (NEW.is_valid = false)
  EXECUTE FUNCTION public.detect_invalid_blocks();

-- Function to get unread alerts count
CREATE OR REPLACE FUNCTION public.get_unread_blockchain_alerts_count(p_org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.blockchain_alerts
  WHERE org_id = p_org_id
    AND is_read = false
    AND is_resolved = false;
    
  RETURN v_count;
END;
$$;

-- Enable realtime for blockchain_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.blockchain_alerts;