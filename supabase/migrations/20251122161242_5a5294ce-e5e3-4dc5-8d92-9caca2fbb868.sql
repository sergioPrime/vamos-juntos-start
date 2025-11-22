-- Create fiscal configuration table for SEFAZ integration
CREATE TABLE IF NOT EXISTS public.fiscal_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id),
  
  -- Certificate data (encrypted)
  certificate_pfx bytea,
  certificate_password_encrypted text,
  certificate_expires_at timestamp with time zone,
  
  -- SEFAZ configuration
  ambiente text NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
  uf text NOT NULL,
  serie_nfe text NOT NULL DEFAULT '1',
  proximo_numero_nfe integer NOT NULL DEFAULT 1,
  
  -- Emitter configuration
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text NOT NULL,
  inscricao_estadual text NOT NULL,
  inscricao_municipal text,
  cnae text,
  regime_tributario text NOT NULL,
  
  -- Address
  logradouro text NOT NULL,
  numero text NOT NULL,
  complemento text,
  bairro text NOT NULL,
  codigo_municipio text NOT NULL,
  municipio text NOT NULL,
  uf_emitente text NOT NULL,
  cep text NOT NULL,
  
  -- Contact
  telefone text,
  email text,
  
  -- Settings
  is_active boolean NOT NULL DEFAULT true,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_org_company UNIQUE(org_id, company_id)
);

-- Create index for faster lookups
CREATE INDEX idx_fiscal_config_org_id ON public.fiscal_config(org_id);
CREATE INDEX idx_fiscal_config_company_id ON public.fiscal_config(company_id);

-- Enable RLS
ALTER TABLE public.fiscal_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view fiscal config from their organization"
  ON public.fiscal_config
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage fiscal config from their organization"
  ON public.fiscal_config
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_fiscal_config_updated_at
  BEFORE UPDATE ON public.fiscal_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create table for SEFAZ communication logs
CREATE TABLE IF NOT EXISTS public.fiscal_sefaz_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  nfe_id uuid REFERENCES public.fiscal_nfe(id),
  
  operation_type text NOT NULL, -- 'autorizacao', 'cancelamento', 'consulta', 'cce', 'inutilizacao'
  request_xml text,
  response_xml text,
  status_code text,
  status_message text,
  protocolo text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index
CREATE INDEX idx_fiscal_sefaz_logs_nfe_id ON public.fiscal_sefaz_logs(nfe_id);
CREATE INDEX idx_fiscal_sefaz_logs_org_id ON public.fiscal_sefaz_logs(org_id);

-- Enable RLS
ALTER TABLE public.fiscal_sefaz_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view SEFAZ logs from their organization"
  ON public.fiscal_sefaz_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert SEFAZ logs"
  ON public.fiscal_sefaz_logs
  FOR INSERT
  WITH CHECK (true);