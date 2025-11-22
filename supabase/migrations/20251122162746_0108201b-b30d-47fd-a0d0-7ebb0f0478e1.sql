-- Create table for email templates
CREATE TABLE IF NOT EXISTS public.fiscal_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  nome text NOT NULL,
  assunto text NOT NULL,
  mensagem_padrao text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index
CREATE INDEX idx_fiscal_email_templates_org_id ON public.fiscal_email_templates(org_id);

-- Enable RLS
ALTER TABLE public.fiscal_email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view email templates from their organization"
  ON public.fiscal_email_templates
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage email templates from their organization"
  ON public.fiscal_email_templates
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_fiscal_email_templates_updated_at
  BEFORE UPDATE ON public.fiscal_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();