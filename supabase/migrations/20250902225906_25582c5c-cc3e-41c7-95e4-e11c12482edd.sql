-- Add comprehensive supplier fields organized by sections

-- A) Basic Data fields
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS trade_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS state_registration text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS municipal_registration text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS cnae_code text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS business_activity text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- B) Contact fields
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS main_contact_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS landline_phone text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS mobile_phone text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS whatsapp_phone text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS main_email text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS billing_email text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS website text;

-- C) Address fields (enhance existing)
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS street_type text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS street_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS street_number text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS complement text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS neighborhood text;

-- D) Financial and Commercial fields
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS bank_agency text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS pix_key text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS default_payment_terms text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS average_delivery_time text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS commercial_notes text;

-- E) Documentation fields
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS documents_folder text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS general_observations text;

-- Audit trail fields
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS last_modified_by uuid;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS last_modified_at timestamp with time zone;

-- Update existing columns to match new structure
ALTER TABLE public.suppliers ALTER COLUMN email TYPE text;
ALTER TABLE public.suppliers RENAME COLUMN email TO main_email;

-- Create function to update last_modified fields
CREATE OR REPLACE FUNCTION public.update_supplier_modified_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_by = auth.uid();
  NEW.last_modified_at = now();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit trail
DROP TRIGGER IF EXISTS update_supplier_modified_trigger ON public.suppliers;
CREATE TRIGGER update_supplier_modified_trigger
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_modified_fields();

-- Create table for supplier documents
CREATE TABLE IF NOT EXISTS public.supplier_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_path text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  org_id uuid NOT NULL
);

-- Enable RLS on supplier documents
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supplier documents
CREATE POLICY "Users can manage supplier documents from their organization"
ON public.supplier_documents
FOR ALL
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create table for supplier history/audit trail
CREATE TABLE IF NOT EXISTS public.supplier_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  changed_by uuid NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  org_id uuid NOT NULL
);

-- Enable RLS on supplier history
ALTER TABLE public.supplier_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supplier history
CREATE POLICY "Users can view supplier history from their organization"
ON public.supplier_history
FOR SELECT
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert supplier history for their organization"
ON public.supplier_history
FOR INSERT
WITH CHECK (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
) AND changed_by = auth.uid());