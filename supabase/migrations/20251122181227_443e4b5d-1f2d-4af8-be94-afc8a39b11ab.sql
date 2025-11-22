-- FASE 1.1: Adicionar campos de configuração NFC-e
ALTER TABLE public.fiscal_config
ADD COLUMN IF NOT EXISTS csc_producao TEXT,
ADD COLUMN IF NOT EXISTS csc_id_producao INTEGER,
ADD COLUMN IF NOT EXISTS csc_homologacao TEXT,
ADD COLUMN IF NOT EXISTS csc_id_homologacao INTEGER,
ADD COLUMN IF NOT EXISTS serie_nfce TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS proximo_numero_nfce INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS token_contingencia TEXT,
ADD COLUMN IF NOT EXISTS impressora_padrao TEXT;

-- FASE 1.2: Função de validação de emissão de NFC-e
CREATE OR REPLACE FUNCTION public.validate_nfce_emission(p_org_id UUID)
RETURNS TABLE(is_valid BOOLEAN, errors TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_errors TEXT[] := '{}';
  v_config RECORD;
BEGIN
  -- Buscar configuração fiscal
  SELECT * INTO v_config
  FROM public.fiscal_config
  WHERE org_id = p_org_id AND is_active = true;
  
  IF NOT FOUND THEN
    v_errors := array_append(v_errors, 'Configuração fiscal não encontrada. Configure os dados fiscais antes de emitir NFC-e.');
    RETURN QUERY SELECT false, v_errors;
    RETURN;
  END IF;
  
  -- Validar certificado
  IF v_config.certificate_pfx IS NULL THEN
    v_errors := array_append(v_errors, 'Certificado digital não configurado. Faça upload do certificado A1.');
  END IF;
  
  IF v_config.certificate_expires_at IS NOT NULL AND v_config.certificate_expires_at < now() THEN
    v_errors := array_append(v_errors, 'Certificado digital expirado. Renove o certificado para continuar emitindo NFC-e.');
  END IF;
  
  -- Validar CSC (Código de Segurança do Contribuinte)
  IF v_config.ambiente = 'producao' THEN
    IF v_config.csc_producao IS NULL OR v_config.csc_id_producao IS NULL THEN
      v_errors := array_append(v_errors, 'CSC de produção não configurado. Obtenha o CSC junto à SEFAZ.');
    END IF;
  ELSE
    IF v_config.csc_homologacao IS NULL OR v_config.csc_id_homologacao IS NULL THEN
      v_errors := array_append(v_errors, 'CSC de homologação não configurado. Configure para testes.');
    END IF;
  END IF;
  
  -- Validar dados do emitente
  IF v_config.cnpj IS NULL THEN
    v_errors := array_append(v_errors, 'CNPJ do emitente não configurado.');
  END IF;
  
  IF v_config.inscricao_estadual IS NULL THEN
    v_errors := array_append(v_errors, 'Inscrição Estadual não configurada.');
  END IF;
  
  IF v_config.razao_social IS NULL THEN
    v_errors := array_append(v_errors, 'Razão Social não configurada.');
  END IF;
  
  IF v_config.logradouro IS NULL OR v_config.numero IS NULL OR v_config.bairro IS NULL THEN
    v_errors := array_append(v_errors, 'Endereço do emitente incompleto.');
  END IF;
  
  IF v_config.municipio IS NULL OR v_config.uf IS NULL THEN
    v_errors := array_append(v_errors, 'Município/UF do emitente não configurado.');
  END IF;
  
  -- Validar série NFC-e
  IF v_config.serie_nfce IS NULL THEN
    v_errors := array_append(v_errors, 'Série da NFC-e não configurada.');
  END IF;
  
  -- Retornar resultado
  RETURN QUERY SELECT (array_length(v_errors, 1) IS NULL), v_errors;
END;
$$;

-- FASE 1.3: Tabela de logs de transmissão
CREATE TABLE IF NOT EXISTS public.nfce_transmission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfce_id UUID REFERENCES public.nfce(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Tipo de operação
  operation_type TEXT NOT NULL CHECK (operation_type IN ('emission', 'cancellation', 'query', 'inutilization')),
  
  -- Request/Response
  request_xml TEXT,
  response_xml TEXT,
  request_json JSONB,
  response_json JSONB,
  
  -- Status
  success BOOLEAN NOT NULL DEFAULT false,
  status_code TEXT,
  error_code TEXT,
  error_message TEXT,
  sefaz_message TEXT,
  protocol TEXT,
  
  -- Timing
  request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_timestamp TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  ambiente TEXT, -- producao, homologacao
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nfce_transmission_logs_nfce_id ON public.nfce_transmission_logs(nfce_id);
CREATE INDEX IF NOT EXISTS idx_nfce_transmission_logs_org_id ON public.nfce_transmission_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_nfce_transmission_logs_operation_type ON public.nfce_transmission_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_nfce_transmission_logs_created_at ON public.nfce_transmission_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nfce_transmission_logs_success ON public.nfce_transmission_logs(success);

-- Enable RLS
ALTER TABLE public.nfce_transmission_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view logs from their organization"
  ON public.nfce_transmission_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert logs"
  ON public.nfce_transmission_logs FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Função para limpar logs antigos (executar mensalmente via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_nfce_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Manter apenas logs dos últimos 6 meses
  DELETE FROM public.nfce_transmission_logs
  WHERE created_at < (now() - INTERVAL '6 months');
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.nfce_transmission_logs IS 'Registra todas as comunicações com a SEFAZ para auditoria e troubleshooting';
COMMENT ON COLUMN public.nfce_transmission_logs.operation_type IS 'Tipo de operação: emission (emissão), cancellation (cancelamento), query (consulta), inutilization (inutilização)';
COMMENT ON COLUMN public.nfce_transmission_logs.duration_ms IS 'Duração da operação em milissegundos';
COMMENT ON FUNCTION public.validate_nfce_emission IS 'Valida se a organização está apta a emitir NFC-e, verificando certificado, CSC e dados cadastrais';
COMMENT ON FUNCTION public.cleanup_old_nfce_logs IS 'Função para limpeza automática de logs com mais de 6 meses';