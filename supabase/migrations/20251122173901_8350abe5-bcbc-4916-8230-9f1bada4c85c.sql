-- Criar bucket para armazenar arquivos fiscais (XML e DANFE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nfe-files',
  'nfe-files',
  false,
  10485760, -- 10MB
  ARRAY['application/xml', 'text/xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket nfe-files
-- Usuários podem fazer upload de arquivos da sua organização
CREATE POLICY "Users can upload NFe files from their organization"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'nfe-files'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- Usuários podem visualizar arquivos da sua organização
CREATE POLICY "Users can view NFe files from their organization"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'nfe-files'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- Usuários podem deletar arquivos da sua organização (admin apenas)
CREATE POLICY "Admins can delete NFe files from their organization"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'nfe-files'
  AND (storage.foldername(name))[1] IN (
    SELECT uo.org_id::text 
    FROM user_organizations uo
    JOIN user_roles ur ON ur.user_id = uo.user_id
    WHERE uo.user_id = auth.uid()
      AND ur.role IN ('admin', 'superadmin')
  )
);

-- Adicionar colunas na tabela NFe para armazenar os paths dos arquivos
ALTER TABLE public.nfe 
ADD COLUMN IF NOT EXISTS xml_path TEXT,
ADD COLUMN IF NOT EXISTS danfe_path TEXT;

-- Comentários
COMMENT ON COLUMN public.nfe.xml_path IS 'Caminho do arquivo XML no storage';
COMMENT ON COLUMN public.nfe.danfe_path IS 'Caminho do arquivo DANFE (PDF) no storage';