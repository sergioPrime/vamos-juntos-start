-- Verificar se as colunas org_id e owner_id já existem na tabela customers
DO $$
BEGIN
  -- Adicionar org_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'customers' AND column_name = 'org_id') THEN
    ALTER TABLE public.customers ADD COLUMN org_id UUID REFERENCES public.organizations(id);
  END IF;
  
  -- Adicionar owner_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'customers' AND column_name = 'owner_id') THEN
    ALTER TABLE public.customers ADD COLUMN owner_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Remover as políticas públicas se existirem
DROP POLICY IF EXISTS "Public can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Public can read customers" ON public.customers;
DROP POLICY IF EXISTS "Public can update customers" ON public.customers;

-- Criar políticas de RLS baseadas em organização
CREATE POLICY "Users can view customers from their organization"
ON public.customers
FOR SELECT
TO authenticated
USING (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert customers for their organization"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.user_organizations 
    WHERE user_id = auth.uid()
  )
  AND owner_id = auth.uid()
);

CREATE POLICY "Users can update customers from their organization"
ON public.customers
FOR UPDATE
TO authenticated
USING (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
))
WITH CHECK (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete customers from their organization"
ON public.customers
FOR DELETE
TO authenticated
USING (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
));