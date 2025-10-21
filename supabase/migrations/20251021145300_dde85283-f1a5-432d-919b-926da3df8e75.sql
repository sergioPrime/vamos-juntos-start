-- Criar tabela de leads do CRM
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  source TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'qualificado', 'negociacao', 'ganho', 'perdido')),
  score INTEGER DEFAULT 0,
  estimated_value NUMERIC(15,2),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de estágios do pipeline
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  name TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de oportunidades
CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  lead_id UUID REFERENCES public.crm_leads(id),
  stage_id UUID REFERENCES public.crm_pipeline_stages(id),
  title TEXT NOT NULL,
  company_name TEXT,
  value NUMERIC(15,2),
  probability INTEGER,
  expected_close_date DATE,
  status TEXT DEFAULT 'ativo',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de atividades CRM
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) NOT NULL,
  lead_id UUID REFERENCES public.crm_leads(id),
  opportunity_id UUID REFERENCES public.crm_opportunities(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para crm_leads
CREATE POLICY "Users can view leads from their org" ON public.crm_leads
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create leads in their org" ON public.crm_leads
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update leads in their org" ON public.crm_leads
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete leads in their org" ON public.crm_leads
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- Políticas para crm_pipeline_stages
CREATE POLICY "Users can view stages from their org" ON public.crm_pipeline_stages
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create stages in their org" ON public.crm_pipeline_stages
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update stages in their org" ON public.crm_pipeline_stages
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete stages in their org" ON public.crm_pipeline_stages
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- Políticas para crm_opportunities
CREATE POLICY "Users can view opportunities from their org" ON public.crm_opportunities
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create opportunities in their org" ON public.crm_opportunities
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update opportunities in their org" ON public.crm_opportunities
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete opportunities in their org" ON public.crm_opportunities
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- Políticas para crm_activities
CREATE POLICY "Users can view activities from their org" ON public.crm_activities
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create activities in their org" ON public.crm_activities
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update activities in their org" ON public.crm_activities
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete activities in their org" ON public.crm_activities
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid())
  );

-- Inserir estágios padrão do pipeline para organizações existentes
INSERT INTO public.crm_pipeline_stages (org_id, name, order_number, probability)
SELECT 
  id as org_id,
  stage_name,
  stage_order,
  stage_probability
FROM public.organizations,
LATERAL (
  VALUES 
    ('Novo Lead', 1, 10),
    ('Qualificação', 2, 25),
    ('Proposta', 3, 50),
    ('Negociação', 4, 75),
    ('Fechado Ganho', 5, 100)
) AS stages(stage_name, stage_order, stage_probability)
ON CONFLICT DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_id ON public.crm_leads(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON public.crm_leads(assigned_to);

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_org_id ON public.crm_opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage_id ON public.crm_opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_lead_id ON public.crm_opportunities(lead_id);

CREATE INDEX IF NOT EXISTS idx_crm_activities_org_id ON public.crm_activities(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled_at ON public.crm_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_activities_completed ON public.crm_activities(completed);
