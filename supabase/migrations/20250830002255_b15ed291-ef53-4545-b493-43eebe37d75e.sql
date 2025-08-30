-- Create quotes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quotes (
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

-- Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoices (
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

-- Create nfse table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nfse (
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
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoices_customer_id' AND table_name = 'invoices') THEN
        ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoices_quote_id' AND table_name = 'invoices') THEN
        ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_quote_id FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_quotes_customer_id' AND table_name = 'quotes') THEN
        ALTER TABLE public.quotes ADD CONSTRAINT fk_quotes_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_nfse_customer_id' AND table_name = 'nfse') THEN
        ALTER TABLE public.nfse ADD CONSTRAINT fk_nfse_customer_id FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_nfse_invoice_id' AND table_name = 'nfse') THEN
        ALTER TABLE public.nfse ADD CONSTRAINT fk_nfse_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quotes
DROP POLICY IF EXISTS "Users can view quotes from their organization" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert quotes for their organization" ON public.quotes;
DROP POLICY IF EXISTS "Users can update quotes from their organization" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete quotes from their organization" ON public.quotes;

CREATE POLICY "Users can view quotes from their organization" ON public.quotes FOR SELECT USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can insert quotes for their organization" ON public.quotes FOR INSERT WITH CHECK ((org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())) AND (owner_id = auth.uid()));
CREATE POLICY "Users can update quotes from their organization" ON public.quotes FOR UPDATE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can delete quotes from their organization" ON public.quotes FOR DELETE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

-- Create RLS policies for invoices
DROP POLICY IF EXISTS "Users can view invoices from their organization" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert invoices for their organization" ON public.invoices;
DROP POLICY IF EXISTS "Users can update invoices from their organization" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete invoices from their organization" ON public.invoices;

CREATE POLICY "Users can view invoices from their organization" ON public.invoices FOR SELECT USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can insert invoices for their organization" ON public.invoices FOR INSERT WITH CHECK ((org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())) AND (owner_id = auth.uid()));
CREATE POLICY "Users can update invoices from their organization" ON public.invoices FOR UPDATE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can delete invoices from their organization" ON public.invoices FOR DELETE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

-- Create RLS policies for nfse
DROP POLICY IF EXISTS "Users can view nfse from their organization" ON public.nfse;
DROP POLICY IF EXISTS "Users can insert nfse for their organization" ON public.nfse;
DROP POLICY IF EXISTS "Users can update nfse from their organization" ON public.nfse;
DROP POLICY IF EXISTS "Users can delete nfse from their organization" ON public.nfse;

CREATE POLICY "Users can view nfse from their organization" ON public.nfse FOR SELECT USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can insert nfse for their organization" ON public.nfse FOR INSERT WITH CHECK ((org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())) AND (owner_id = auth.uid()));
CREATE POLICY "Users can update nfse from their organization" ON public.nfse FOR UPDATE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));
CREATE POLICY "Users can delete nfse from their organization" ON public.nfse FOR DELETE USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
DROP TRIGGER IF EXISTS update_nfse_updated_at ON public.nfse;

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nfse_updated_at BEFORE UPDATE ON public.nfse FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_org_id ON public.quotes(org_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_nfse_org_id ON public.nfse(org_id);
CREATE INDEX IF NOT EXISTS idx_nfse_status ON public.nfse(status);

-- Ensure the trigger for automatic organization creation exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_organization();