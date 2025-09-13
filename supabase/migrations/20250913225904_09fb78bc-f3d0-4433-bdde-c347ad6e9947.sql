-- Create pessoas table for people management
CREATE TABLE public.pessoas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  tipo_pessoa TEXT NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  documento TEXT NOT NULL,
  codigo TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  email_geral TEXT,
  emails_secundarios TEXT[],
  telefone TEXT,
  telefone_celular TEXT,
  whatsapps TEXT[],
  bloquear_notificacoes_whatsapp BOOLEAN DEFAULT false,
  vendedor_padrao TEXT,
  transportadora_padrao TEXT,
  rotulos TEXT[],
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- Create policies for pessoas table
CREATE POLICY "Users can view pessoas from their organization" 
ON public.pessoas 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert pessoas for their organization" 
ON public.pessoas 
FOR INSERT 
WITH CHECK (
  org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update pessoas from their organization" 
ON public.pessoas 
FOR UPDATE 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can delete pessoas from their organization" 
ON public.pessoas 
FOR DELETE 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pessoas_updated_at
BEFORE UPDATE ON public.pessoas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();