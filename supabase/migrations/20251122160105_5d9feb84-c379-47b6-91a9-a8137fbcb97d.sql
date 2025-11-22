-- Criar tabela fiscal_nfe (renomear/atualizar tabela nfe existente)
CREATE TABLE IF NOT EXISTS public.fiscal_nfe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  company_id UUID REFERENCES public.companies(id),
  
  -- Identificação
  numero INTEGER NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  modelo TEXT NOT NULL DEFAULT '55',
  chave_acesso TEXT,
  
  -- Status e datas
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente', 'autorizada', 'rejeitada', 'cancelada', 'denegada')),
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_saida TIMESTAMP WITH TIME ZONE,
  data_autorizacao TIMESTAMP WITH TIME ZONE,
  data_cancelamento TIMESTAMP WITH TIME ZONE,
  
  -- Protocolos
  protocolo_autorizacao TEXT,
  protocolo_cancelamento TEXT,
  
  -- Natureza da operação
  natureza_operacao TEXT NOT NULL,
  tipo_operacao TEXT NOT NULL DEFAULT 'saida' CHECK (tipo_operacao IN ('entrada', 'saida')),
  finalidade TEXT NOT NULL DEFAULT 'normal' CHECK (finalidade IN ('normal', 'complementar', 'ajuste', 'devolucao')),
  
  -- Destinatário
  destinatario_tipo TEXT NOT NULL DEFAULT 'cliente' CHECK (destinatario_tipo IN ('cliente', 'fornecedor', 'pessoa')),
  destinatario_id UUID,
  destinatario_nome TEXT NOT NULL,
  destinatario_documento TEXT NOT NULL,
  destinatario_ie TEXT,
  destinatario_email TEXT,
  destinatario_telefone TEXT,
  destinatario_endereco TEXT,
  destinatario_numero TEXT,
  destinatario_complemento TEXT,
  destinatario_bairro TEXT,
  destinatario_cidade TEXT,
  destinatario_uf TEXT,
  destinatario_cep TEXT,
  
  -- Valores dos produtos
  valor_total_produtos NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_outras_despesas NUMERIC(15,2) DEFAULT 0,
  
  -- Tributos tradicionais
  base_calculo_icms NUMERIC(15,2) DEFAULT 0,
  valor_icms NUMERIC(15,2) DEFAULT 0,
  valor_icms_st NUMERIC(15,2) DEFAULT 0,
  valor_ipi NUMERIC(15,2) DEFAULT 0,
  valor_pis NUMERIC(15,2) DEFAULT 0,
  valor_cofins NUMERIC(15,2) DEFAULT 0,
  
  -- Novos tributos Reforma 2026 (IBS, CBS, IS)
  valor_total_ibs NUMERIC(15,2) DEFAULT 0,
  valor_ibs_uf NUMERIC(15,2) DEFAULT 0,
  valor_ibs_municipal NUMERIC(15,2) DEFAULT 0,
  valor_total_cbs NUMERIC(15,2) DEFAULT 0,
  valor_cbs NUMERIC(15,2) DEFAULT 0,
  valor_total_is NUMERIC(15,2) DEFAULT 0,
  
  -- Valor total da nota
  valor_total_nota NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Transporte
  modalidade_frete TEXT DEFAULT 'sem_frete' CHECK (modalidade_frete IN ('emitente', 'destinatario', 'terceiros', 'proprio', 'sem_frete')),
  transportadora_nome TEXT,
  transportadora_documento TEXT,
  transportadora_endereco TEXT,
  transportadora_cidade TEXT,
  transportadora_uf TEXT,
  veiculo_placa TEXT,
  veiculo_uf TEXT,
  
  -- Volumes
  volumes_quantidade INTEGER,
  volumes_especie TEXT,
  volumes_marca TEXT,
  volumes_numeracao TEXT,
  volumes_peso_bruto NUMERIC(15,3),
  volumes_peso_liquido NUMERIC(15,3),
  
  -- Informações adicionais
  informacoes_complementares TEXT,
  informacoes_fisco TEXT,
  
  -- Cancelamento
  justificativa_cancelamento TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(org_id, numero, serie)
);

-- Índices para fiscal_nfe
CREATE INDEX idx_fiscal_nfe_org_id ON public.fiscal_nfe(org_id);
CREATE INDEX idx_fiscal_nfe_status ON public.fiscal_nfe(status);
CREATE INDEX idx_fiscal_nfe_data_emissao ON public.fiscal_nfe(data_emissao);
CREATE INDEX idx_fiscal_nfe_chave_acesso ON public.fiscal_nfe(chave_acesso);
CREATE INDEX idx_fiscal_nfe_destinatario ON public.fiscal_nfe(destinatario_id);

-- Criar tabela fiscal_nfe_items
CREATE TABLE IF NOT EXISTS public.fiscal_nfe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.fiscal_nfe(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  
  -- Produto
  product_id UUID REFERENCES public.products(id),
  codigo_produto TEXT,
  descricao_produto TEXT NOT NULL,
  ncm TEXT,
  cest TEXT,
  cfop TEXT NOT NULL,
  unidade_comercial TEXT NOT NULL DEFAULT 'UN',
  
  -- Quantidades e valores
  quantidade_comercial NUMERIC(15,4) NOT NULL,
  valor_unitario_comercial NUMERIC(15,4) NOT NULL,
  valor_total NUMERIC(15,2) NOT NULL,
  valor_desconto NUMERIC(15,2) DEFAULT 0,
  valor_frete NUMERIC(15,2) DEFAULT 0,
  valor_seguro NUMERIC(15,2) DEFAULT 0,
  valor_outras_despesas NUMERIC(15,2) DEFAULT 0,
  
  -- Tributos tradicionais - ICMS
  icms_origem TEXT,
  icms_cst TEXT,
  icms_modalidade_bc TEXT,
  icms_base_calculo NUMERIC(15,2) DEFAULT 0,
  icms_aliquota NUMERIC(5,2) DEFAULT 0,
  icms_valor NUMERIC(15,2) DEFAULT 0,
  
  -- IPI
  ipi_cst TEXT,
  ipi_base_calculo NUMERIC(15,2) DEFAULT 0,
  ipi_aliquota NUMERIC(5,2) DEFAULT 0,
  ipi_valor NUMERIC(15,2) DEFAULT 0,
  
  -- PIS
  pis_cst TEXT,
  pis_base_calculo NUMERIC(15,2) DEFAULT 0,
  pis_aliquota NUMERIC(5,2) DEFAULT 0,
  pis_valor NUMERIC(15,2) DEFAULT 0,
  
  -- COFINS
  cofins_cst TEXT,
  cofins_base_calculo NUMERIC(15,2) DEFAULT 0,
  cofins_aliquota NUMERIC(5,2) DEFAULT 0,
  cofins_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Novos tributos Reforma 2026
  -- IBS (Imposto sobre Bens e Serviços) - Estadual e Municipal
  ibs_uf_aliquota NUMERIC(5,4) DEFAULT 0,
  ibs_uf_base_calculo NUMERIC(15,2) DEFAULT 0,
  ibs_uf_valor NUMERIC(15,2) DEFAULT 0,
  ibs_municipal_aliquota NUMERIC(5,4) DEFAULT 0,
  ibs_municipal_base_calculo NUMERIC(15,2) DEFAULT 0,
  ibs_mun_valor NUMERIC(15,2) DEFAULT 0,
  
  -- CBS (Contribuição sobre Bens e Serviços) - Federal
  cbs_aliquota NUMERIC(5,4) DEFAULT 0,
  cbs_base_calculo NUMERIC(15,2) DEFAULT 0,
  cbs_valor NUMERIC(15,2) DEFAULT 0,
  
  -- IS (Imposto Seletivo) - Federal sobre produtos específicos
  is_aliquota NUMERIC(5,4) DEFAULT 0,
  is_base_calculo NUMERIC(15,2) DEFAULT 0,
  is_valor NUMERIC(15,2) DEFAULT 0,
  
  -- Informações adicionais
  informacoes_adicionais TEXT,
  numero_pedido TEXT,
  item_pedido INTEGER,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para fiscal_nfe_items
CREATE INDEX idx_fiscal_nfe_items_nfe_id ON public.fiscal_nfe_items(nfe_id);
CREATE INDEX idx_fiscal_nfe_items_product_id ON public.fiscal_nfe_items(product_id);

-- Criar tabela fiscal_nfe_cce (Carta de Correção Eletrônica)
CREATE TABLE IF NOT EXISTS public.fiscal_nfe_cce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.fiscal_nfe(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  
  sequencia INTEGER NOT NULL DEFAULT 1,
  correcao TEXT NOT NULL,
  protocolo TEXT,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'registrado', 'rejeitado')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(nfe_id, sequencia)
);

-- Índices para fiscal_nfe_cce
CREATE INDEX idx_fiscal_nfe_cce_nfe_id ON public.fiscal_nfe_cce(nfe_id);

-- Criar tabela fiscal_nfe_emails (Histórico de envios)
CREATE TABLE IF NOT EXISTS public.fiscal_nfe_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_id UUID NOT NULL REFERENCES public.fiscal_nfe(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  
  destinatario_email TEXT NOT NULL,
  mensagem_adicional TEXT,
  status_envio TEXT NOT NULL DEFAULT 'pendente' CHECK (status_envio IN ('pendente', 'enviado', 'erro')),
  erro_mensagem TEXT,
  data_envio TIMESTAMP WITH TIME ZONE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para fiscal_nfe_emails
CREATE INDEX idx_fiscal_nfe_emails_nfe_id ON public.fiscal_nfe_emails(nfe_id);

-- Trigger para calcular totais da NFe
CREATE OR REPLACE FUNCTION public.calculate_fiscal_nfe_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_totals RECORD;
BEGIN
  -- Calcular totais de produtos e tributos
  SELECT 
    COALESCE(SUM(valor_total), 0) as total_produtos,
    COALESCE(SUM(icms_valor), 0) as total_icms,
    COALESCE(SUM(ipi_valor), 0) as total_ipi,
    COALESCE(SUM(pis_valor), 0) as total_pis,
    COALESCE(SUM(cofins_valor), 0) as total_cofins,
    COALESCE(SUM(ibs_uf_valor), 0) as total_ibs_uf,
    COALESCE(SUM(ibs_mun_valor), 0) as total_ibs_mun,
    COALESCE(SUM(cbs_valor), 0) as total_cbs,
    COALESCE(SUM(is_valor), 0) as total_is
  INTO v_totals
  FROM fiscal_nfe_items
  WHERE nfe_id = NEW.nfe_id;

  -- Atualizar NFe com os totais
  UPDATE fiscal_nfe SET
    valor_total_produtos = v_totals.total_produtos,
    valor_icms = v_totals.total_icms,
    valor_ipi = v_totals.total_ipi,
    valor_pis = v_totals.total_pis,
    valor_cofins = v_totals.total_cofins,
    valor_total_ibs = v_totals.total_ibs_uf + v_totals.total_ibs_mun,
    valor_ibs_uf = v_totals.total_ibs_uf,
    valor_ibs_municipal = v_totals.total_ibs_mun,
    valor_total_cbs = v_totals.total_cbs,
    valor_cbs = v_totals.total_cbs,
    valor_total_is = v_totals.total_is,
    valor_total_nota = v_totals.total_produtos + 
                      v_totals.total_ipi +
                      v_totals.total_ibs_uf +
                      v_totals.total_ibs_mun +
                      v_totals.total_cbs +
                      v_totals.total_is +
                      COALESCE(valor_frete, 0) +
                      COALESCE(valor_seguro, 0) +
                      COALESCE(valor_outras_despesas, 0) -
                      COALESCE(valor_desconto, 0),
    updated_at = now()
  WHERE id = NEW.nfe_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_fiscal_nfe_totals ON public.fiscal_nfe_items;
CREATE TRIGGER trigger_calculate_fiscal_nfe_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.fiscal_nfe_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_fiscal_nfe_totals();

-- Trigger para gerar número sequencial de NFe
CREATE OR REPLACE FUNCTION public.generate_fiscal_nfe_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    NEW.numero := public.generate_next_nfe_number(NEW.org_id, NEW.serie);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_generate_fiscal_nfe_number ON public.fiscal_nfe;
CREATE TRIGGER trigger_generate_fiscal_nfe_number
  BEFORE INSERT ON public.fiscal_nfe
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_fiscal_nfe_number();

-- RLS Policies
ALTER TABLE public.fiscal_nfe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_nfe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_nfe_cce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_nfe_emails ENABLE ROW LEVEL SECURITY;

-- Policies para fiscal_nfe
CREATE POLICY "Users can manage NFe from their organization"
  ON public.fiscal_nfe
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Policies para fiscal_nfe_items
CREATE POLICY "Users can manage NFe items from their organization"
  ON public.fiscal_nfe_items
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Policies para fiscal_nfe_cce
CREATE POLICY "Users can manage CCe from their organization"
  ON public.fiscal_nfe_cce
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Policies para fiscal_nfe_emails
CREATE POLICY "Users can manage NFe emails from their organization"
  ON public.fiscal_nfe_emails
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));