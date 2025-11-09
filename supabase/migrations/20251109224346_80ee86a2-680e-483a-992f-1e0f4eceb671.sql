-- Create tax_groups table (Grupos Tributários)
CREATE TABLE public.tax_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fiscal_operations table (Operações Fiscais)
CREATE TABLE public.fiscal_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  tax_group_id UUID NOT NULL REFERENCES public.tax_groups(id),
  operation_name TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  
  -- Base tab fields
  pis_situation TEXT NOT NULL,
  cofins_situation TEXT NOT NULL,
  additional_info TEXT,
  
  -- ICMS tab fields
  icms_situation TEXT,
  sum_ipi_on_base BOOLEAN DEFAULT false,
  show_icms_st_on_invoice BOOLEAN DEFAULT false,
  interstate_icms_rate NUMERIC(5,2) DEFAULT 0,
  internal_icms_rate NUMERIC(5,2) DEFAULT 0,
  fcp_rate NUMERIC(5,2) DEFAULT 0,
  calculate_base_inside BOOLEAN DEFAULT false,
  effective_icms_bc_reduction NUMERIC(5,2) DEFAULT 0,
  effective_icms_rate NUMERIC(5,2) DEFAULT 0,
  
  -- IPI tab fields
  ipi_situation_suframa TEXT,
  ipi_situation_general TEXT,
  ipi_rate_suframa NUMERIC(5,2) DEFAULT 0,
  ipi_rate_general NUMERIC(5,2) DEFAULT 0,
  ex_tipi_suframa TEXT,
  ex_tipi_general TEXT,
  ipi_class_suframa TEXT,
  ipi_class_general TEXT,
  
  -- CFOP tab fields (stored as JSONB array)
  cfop_codes JSONB DEFAULT '[]'::jsonb,
  
  -- Demais Classificações Fiscais
  fiscal_benefit TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_tax_groups_org_id ON public.tax_groups(org_id);
CREATE INDEX idx_tax_groups_active ON public.tax_groups(is_active);
CREATE INDEX idx_fiscal_operations_org_id ON public.fiscal_operations(org_id);
CREATE INDEX idx_fiscal_operations_tax_group ON public.fiscal_operations(tax_group_id);
CREATE INDEX idx_fiscal_operations_state ON public.fiscal_operations(destination_state);

-- Enable RLS
ALTER TABLE public.tax_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_groups
CREATE POLICY "Users can manage tax groups from their organization"
  ON public.tax_groups
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));

-- RLS Policies for fiscal_operations
CREATE POLICY "Users can manage fiscal operations from their organization"
  ON public.fiscal_operations
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
  ));