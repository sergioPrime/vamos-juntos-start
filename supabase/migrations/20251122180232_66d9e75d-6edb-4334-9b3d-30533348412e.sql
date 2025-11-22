-- Dropar tabela existente e recriar com estrutura correta
DROP TABLE IF EXISTS public.nfse CASCADE;

-- Criar tabela para NFS-e (Nota Fiscal de Serviço Eletrônica)
CREATE TABLE public.nfse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  
  -- Dados do tomador
  tomador_nome TEXT NOT NULL,
  tomador_cpf_cnpj TEXT NOT NULL,
  tomador_email TEXT,
  tomador_telefone TEXT,
  tomador_endereco TEXT,
  tomador_numero TEXT,
  tomador_bairro TEXT,
  tomador_cidade TEXT,
  tomador_uf TEXT,
  tomador_cep TEXT,
  
  -- Dados do serviço
  codigo_servico TEXT NOT NULL,
  discriminacao TEXT NOT NULL,
  codigo_tributacao_municipio TEXT,
  
  -- Valores
  valor_servicos NUMERIC(15,2) NOT NULL,
  valor_deducoes NUMERIC(15,2) DEFAULT 0,
  valor_pis NUMERIC(15,2) DEFAULT 0,
  valor_cofins NUMERIC(15,2) DEFAULT 0,
  valor_inss NUMERIC(15,2) DEFAULT 0,
  valor_ir NUMERIC(15,2) DEFAULT 0,
  valor_csll NUMERIC(15,2) DEFAULT 0,
  valor_iss NUMERIC(15,2) DEFAULT 0,
  valor_iss_retido NUMERIC(15,2) DEFAULT 0,
  aliquota_iss NUMERIC(5,2) DEFAULT 0,
  valor_liquido NUMERIC(15,2) NOT NULL,
  
  -- Retenções
  iss_retido BOOLEAN DEFAULT false,
  pis_retido BOOLEAN DEFAULT false,
  cofins_retido BOOLEAN DEFAULT false,
  inss_retido BOOLEAN DEFAULT false,
  ir_retido BOOLEAN DEFAULT false,
  csll_retido BOOLEAN DEFAULT false,
  
  -- Status e controle
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'autorizada', 'cancelada', 'rejeitada')),
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_competencia DATE NOT NULL,
  protocolo TEXT,
  numero_rps INTEGER,
  serie_rps TEXT,
  codigo_verificacao TEXT,
  link_visualizacao TEXT,
  xml_nfse TEXT,
  mensagem_retorno TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT
);

-- Índices
CREATE INDEX idx_nfse_org_id ON public.nfse(org_id);
CREATE INDEX idx_nfse_status ON public.nfse(status);
CREATE INDEX idx_nfse_data_emissao ON public.nfse(data_emissao);
CREATE INDEX idx_nfse_numero ON public.nfse(numero);
CREATE INDEX idx_nfse_tomador_cpf_cnpj ON public.nfse(tomador_cpf_cnpj);
CREATE UNIQUE INDEX idx_nfse_unique_number ON public.nfse(org_id, numero, serie) WHERE status != 'cancelada';

-- RLS
ALTER TABLE public.nfse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view NFS-e from their org" ON public.nfse FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create NFS-e for their org" ON public.nfse FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update NFS-e from their org" ON public.nfse FOR UPDATE
  USING (org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete NFS-e from their org" ON public.nfse FOR DELETE
  USING (org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()) AND status = 'pendente');

-- Funções
CREATE OR REPLACE FUNCTION public.generate_next_nfse_number(p_org_id uuid, p_serie text DEFAULT '1')
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO next_number
  FROM public.nfse WHERE org_id = p_org_id AND serie = p_serie;
  RETURN next_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_nfse_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    NEW.numero := public.generate_next_nfse_number(NEW.org_id, NEW.serie);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_nfse_number_trigger BEFORE INSERT ON public.nfse
  FOR EACH ROW EXECUTE FUNCTION public.set_nfse_number();