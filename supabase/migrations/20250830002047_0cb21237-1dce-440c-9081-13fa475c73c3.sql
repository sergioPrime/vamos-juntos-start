-- Create services table for service catalog
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'un',
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  customer_id UUID,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_items table
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL,
  service_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  customer_id UUID,
  quote_id UUID,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  notes TEXT,
  pix_key TEXT,
  pix_qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  service_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nfse table
CREATE TABLE public.nfse (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  customer_id UUID,
  invoice_id UUID,
  number TEXT,
  verification_code TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  service_description TEXT NOT NULL,
  service_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  iss_rate NUMERIC(5,2) DEFAULT 2.00,
  iss_amount NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) DEFAULT 0,
  issued_at TIMESTAMP WITH TIME ZONE,
  xml_content TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.quote_items ADD CONSTRAINT fk_quote_items_quote_id FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE public.quote_items ADD CONSTRAINT fk_quote_items_service_id FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;

ALTER TABLE public.invoice_items ADD CONSTRAINT fk_invoice_items_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE public.invoice_items ADD CONSTRAINT fk_invoice_items_service_id FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;

ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_quote_id FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;

ALTER TABLE public.quotes ADD CONSTRAINT fk_quotes_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.nfse ADD CONSTRAINT fk_nfse_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.nfse ADD CONSTRAINT fk_nfse_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for services
CREATE POLICY "Users can view services from their organization" ON public.services FOR SELECT USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can insert services for their organization" ON public.services FOR INSERT WITH CHECK ((org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())) AND (owner_id = auth.uid()));
CREATE POLICY "Users can update services from their organization" ON public.services FOR UPDATE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can delete services from their organization" ON public.services FOR DELETE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

-- Create RLS policies for quotes
CREATE POLICY "Users can view quotes from their organization" ON public.quotes FOR SELECT USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can insert quotes for their organization" ON public.quotes FOR INSERT WITH CHECK ((org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())) AND (owner_id = auth.uid()));
CREATE POLICY "Users can update quotes from their organization" ON public.quotes FOR UPDATE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can delete quotes from their organization" ON public.quotes FOR DELETE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

-- Create RLS policies for quote_items
CREATE POLICY "Users can view quote items from their organization" ON public.quote_items FOR SELECT USING (quote_id IN (SELECT quotes.id FROM quotes WHERE quotes.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));
CREATE POLICY "Users can insert quote items for their organization" ON public.quote_items FOR INSERT WITH CHECK (quote_id IN (SELECT quotes.id FROM quotes WHERE quotes.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));
CREATE POLICY "Users can update quote items from their organization" ON public.quote_items FOR UPDATE USING (quote_id IN (SELECT quotes.id FROM quotes WHERE quotes.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));
CREATE POLICY "Users can delete quote items from their organization" ON public.quote_items FOR DELETE USING (quote_id IN (SELECT quotes.id FROM quotes WHERE quotes.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));

-- Create RLS policies for invoices
CREATE POLICY "Users can view invoices from their organization" ON public.invoices FOR SELECT USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can insert invoices for their organization" ON public.invoices FOR INSERT WITH CHECK ((org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())) AND (owner_id = auth.uid()));
CREATE POLICY "Users can update invoices from their organization" ON public.invoices FOR UPDATE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can delete invoices from their organization" ON public.invoices FOR DELETE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

-- Create RLS policies for invoice_items
CREATE POLICY "Users can view invoice items from their organization" ON public.invoice_items FOR SELECT USING (invoice_id IN (SELECT invoices.id FROM invoices WHERE invoices.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));
CREATE POLICY "Users can insert invoice items for their organization" ON public.invoice_items FOR INSERT WITH CHECK (invoice_id IN (SELECT invoices.id FROM invoices WHERE invoices.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));
CREATE POLICY "Users can update invoice items from their organization" ON public.invoice_items FOR UPDATE USING (invoice_id IN (SELECT invoices.id FROM invoices WHERE invoices.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));
CREATE POLICY "Users can delete invoice items from their organization" ON public.invoice_items FOR DELETE USING (invoice_id IN (SELECT invoices.id FROM invoices WHERE invoices.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));

-- Create RLS policies for nfse
CREATE POLICY "Users can view nfse from their organization" ON public.nfse FOR SELECT USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can insert nfse for their organization" ON public.nfse FOR INSERT WITH CHECK ((org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())) AND (owner_id = auth.uid()));
CREATE POLICY "Users can update nfse from their organization" ON public.nfse FOR UPDATE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can delete nfse from their organization" ON public.nfse FOR DELETE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nfse_updated_at BEFORE UPDATE ON public.nfse FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_services_org_id ON public.services(org_id);
CREATE INDEX idx_services_owner_id ON public.services(owner_id);
CREATE INDEX idx_quotes_org_id ON public.quotes(org_id);
CREATE INDEX idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_nfse_org_id ON public.nfse(org_id);
CREATE INDEX idx_nfse_status ON public.nfse(status);

-- Add triggers to automatically update tables when user signs up
CREATE OR REPLACE FUNCTION public.create_user_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_org_id UUID;
BEGIN
  -- Criar organização para o usuário
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'empresa-' || NEW.id::text), ' ', '-'))
  )
  RETURNING id INTO new_org_id;
  
  -- Adicionar usuário como owner da organização
  INSERT INTO public.user_organizations (user_id, org_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  RETURN NEW;
END;
$function$;

-- Create trigger for new user organization creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_organization();