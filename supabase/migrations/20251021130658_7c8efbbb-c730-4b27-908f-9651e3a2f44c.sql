-- Create lot_management table
CREATE TABLE IF NOT EXISTS public.lot_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  manufacturing_date DATE,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_lot_per_org UNIQUE (org_id, lot_number)
);

-- Create serial_number_tracking table
CREATE TABLE IF NOT EXISTS public.serial_number_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  lot_id UUID REFERENCES public.lot_management(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved', 'defective')),
  current_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_serial_per_org UNIQUE (org_id, serial_number)
);

-- Create serial_number_history table
CREATE TABLE IF NOT EXISTS public.serial_number_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  serial_number_id UUID NOT NULL REFERENCES public.serial_number_tracking(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'sale', 'return', 'adjustment')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.lot_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_number_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_number_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lot_management
CREATE POLICY "Users can view lots from their organization"
  ON public.lot_management FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lots in their organization"
  ON public.lot_management FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lots in their organization"
  ON public.lot_management FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for serial_number_tracking
CREATE POLICY "Users can view serial numbers from their organization"
  ON public.serial_number_tracking FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert serial numbers in their organization"
  ON public.serial_number_tracking FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update serial numbers in their organization"
  ON public.serial_number_tracking FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for serial_number_history
CREATE POLICY "Users can view serial history from their organization"
  ON public.serial_number_history FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert serial history in their organization"
  ON public.serial_number_history FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_lot_management_org_id ON public.lot_management(org_id);
CREATE INDEX idx_lot_management_product_id ON public.lot_management(product_id);
CREATE INDEX idx_lot_management_expiration ON public.lot_management(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_lot_management_status ON public.lot_management(status);

CREATE INDEX idx_serial_tracking_org_id ON public.serial_number_tracking(org_id);
CREATE INDEX idx_serial_tracking_product_id ON public.serial_number_tracking(product_id);
CREATE INDEX idx_serial_tracking_lot_id ON public.serial_number_tracking(lot_id);
CREATE INDEX idx_serial_tracking_serial ON public.serial_number_tracking(serial_number);

CREATE INDEX idx_serial_history_serial_id ON public.serial_number_history(serial_number_id);
CREATE INDEX idx_serial_history_org_id ON public.serial_number_history(org_id);