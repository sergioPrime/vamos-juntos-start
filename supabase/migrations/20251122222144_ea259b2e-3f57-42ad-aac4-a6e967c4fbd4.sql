-- =====================================================
-- SPRINT 1.1 - MÓDULO DE COMPRAS - DATABASE STRUCTURE
-- =====================================================

-- Tabela: purchases (Compras/Pedidos de Compra)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  purchase_number TEXT GENERATED ALWAYS AS ('PC-' || LPAD(CAST(purchase_code AS TEXT), 6, '0')) STORED,
  purchase_code SERIAL,
  supplier_id UUID REFERENCES pessoas(id) ON DELETE RESTRICT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'ordered', 'partial_received', 'received', 'cancelled')),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  freight_amount NUMERIC(15,2) DEFAULT 0,
  other_expenses NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  delivery_address TEXT,
  payment_condition TEXT,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  company_id UUID REFERENCES companies(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Tabela: purchase_items (Itens do Pedido de Compra)
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(15,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
  discount_percentage NUMERIC(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount NUMERIC(15,2) DEFAULT 0,
  total_price NUMERIC(15,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount) STORED,
  received_quantity NUMERIC(15,3) DEFAULT 0,
  warehouse_id UUID REFERENCES warehouses(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: purchase_requests (Solicitações de Compra)
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  request_number TEXT GENERATED ALWAYS AS ('SC-' || LPAD(CAST(request_code AS TEXT), 6, '0')) STORED,
  request_code SERIAL,
  title TEXT NOT NULL,
  description TEXT,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  department TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted', 'cancelled')),
  total_estimated_amount NUMERIC(15,2) DEFAULT 0,
  justification TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  converted_to_purchase_id UUID REFERENCES purchases(id),
  company_id UUID REFERENCES companies(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: purchase_request_items (Itens da Solicitação)
CREATE TABLE IF NOT EXISTS public.purchase_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  product_description TEXT NOT NULL,
  quantity NUMERIC(15,3) NOT NULL CHECK (quantity > 0),
  estimated_unit_price NUMERIC(15,2),
  estimated_total NUMERIC(15,2) GENERATED ALWAYS AS (quantity * COALESCE(estimated_unit_price, 0)) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: purchase_approvals (Aprovações)
CREATE TABLE IF NOT EXISTS public.purchase_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  request_id UUID REFERENCES purchase_requests(id) ON DELETE CASCADE,
  level_order INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT check_approval_reference CHECK (
    (purchase_id IS NOT NULL AND request_id IS NULL) OR
    (purchase_id IS NULL AND request_id IS NOT NULL)
  )
);

-- Tabela: purchase_receipts (Recebimentos)
CREATE TABLE IF NOT EXISTS public.purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  receipt_number TEXT GENERATED ALWAYS AS ('REC-' || LPAD(CAST(receipt_code AS TEXT), 6, '0')) STORED,
  receipt_code SERIAL,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  receipt_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  received_by UUID NOT NULL REFERENCES profiles(id),
  warehouse_id UUID REFERENCES warehouses(id),
  notes TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela: purchase_receipt_items (Itens Recebidos)
CREATE TABLE IF NOT EXISTS public.purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
  purchase_item_id UUID NOT NULL REFERENCES purchase_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_received NUMERIC(15,3) NOT NULL CHECK (quantity_received > 0),
  quality_check_status TEXT DEFAULT 'pending' CHECK (quality_check_status IN ('pending', 'approved', 'rejected', 'partial')),
  quality_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_purchases_org_id ON purchases(org_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_org_id ON purchase_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_purchase_id ON purchase_receipts(purchase_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_receipt_items ENABLE ROW LEVEL SECURITY;

-- Policies para purchases
CREATE POLICY "Users can view purchases from their org"
  ON purchases FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create purchases in their org"
  ON purchases FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update purchases in their org"
  ON purchases FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete purchases"
  ON purchases FOR DELETE
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin')));

-- Policies para purchase_items
CREATE POLICY "Users can manage purchase items from their org"
  ON purchase_items FOR ALL
  USING (purchase_id IN (SELECT id FROM purchases WHERE org_id IN 
    (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

-- Policies para purchase_requests
CREATE POLICY "Users can view requests from their org"
  ON purchase_requests FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create requests in their org"
  ON purchase_requests FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own requests"
  ON purchase_requests FOR UPDATE
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete requests"
  ON purchase_requests FOR DELETE
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin')));

-- Policies para purchase_request_items
CREATE POLICY "Users can manage request items from their org"
  ON purchase_request_items FOR ALL
  USING (request_id IN (SELECT id FROM purchase_requests WHERE org_id IN 
    (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

-- Policies para purchase_approvals
CREATE POLICY "Users can view approvals from their org"
  ON purchase_approvals FOR SELECT
  USING (
    COALESCE(purchase_id, request_id) IN (
      SELECT id FROM purchases WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
      UNION
      SELECT id FROM purchase_requests WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can manage approvals"
  ON purchase_approvals FOR ALL
  USING (true);

-- Policies para purchase_receipts
CREATE POLICY "Users can manage receipts from their org"
  ON purchase_receipts FOR ALL
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

-- Policies para purchase_receipt_items
CREATE POLICY "Users can manage receipt items from their org"
  ON purchase_receipt_items FOR ALL
  USING (receipt_id IN (SELECT id FROM purchase_receipts WHERE org_id IN 
    (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Função: Atualizar total da compra
CREATE OR REPLACE FUNCTION update_purchase_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchases
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_items
    WHERE purchase_id = COALESCE(NEW.purchase_id, OLD.purchase_id)
  )
  WHERE id = COALESCE(NEW.purchase_id, OLD.purchase_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchase_total
AFTER INSERT OR UPDATE OR DELETE ON purchase_items
FOR EACH ROW EXECUTE FUNCTION update_purchase_total();

-- Função: Atualizar valor estimado da solicitação
CREATE OR REPLACE FUNCTION update_request_estimated_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_requests
  SET total_estimated_amount = (
    SELECT COALESCE(SUM(estimated_total), 0)
    FROM purchase_request_items
    WHERE request_id = COALESCE(NEW.request_id, OLD.request_id)
  )
  WHERE id = COALESCE(NEW.request_id, OLD.request_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_request_estimated_total
AFTER INSERT OR UPDATE OR DELETE ON purchase_request_items
FOR EACH ROW EXECUTE FUNCTION update_request_estimated_total();

-- Função: Atualizar quantidade recebida
CREATE OR REPLACE FUNCTION update_received_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_items
  SET received_quantity = (
    SELECT COALESCE(SUM(quantity_received), 0)
    FROM purchase_receipt_items
    WHERE purchase_item_id = NEW.purchase_item_id
  )
  WHERE id = NEW.purchase_item_id;
  
  -- Atualizar status da compra se tudo foi recebido
  UPDATE purchases p
  SET status = CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM purchase_items pi
      WHERE pi.purchase_id = p.id
      AND pi.received_quantity < pi.quantity
    ) THEN 'received'
    WHEN EXISTS (
      SELECT 1 FROM purchase_items pi
      WHERE pi.purchase_id = p.id
      AND pi.received_quantity > 0
    ) THEN 'partial_received'
    ELSE p.status
  END
  WHERE id = (SELECT purchase_id FROM purchase_items WHERE id = NEW.purchase_item_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_received_quantity
AFTER INSERT OR UPDATE ON purchase_receipt_items
FOR EACH ROW EXECUTE FUNCTION update_received_quantity();

-- Função: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_purchases_updated_at
BEFORE UPDATE ON purchases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_purchase_items_updated_at
BEFORE UPDATE ON purchase_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_purchase_requests_updated_at
BEFORE UPDATE ON purchase_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();