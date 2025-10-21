-- ============================================
-- SPRINT 1.3: VALIDAÇÃO DE RELACIONAMENTOS
-- Garantir integridade entre módulos
-- ============================================

-- Function to validate product exists and is active
CREATE OR REPLACE FUNCTION validate_product_in_order()
RETURNS TRIGGER AS $$
DECLARE
  v_product_exists BOOLEAN;
  v_product_active BOOLEAN;
  v_product_name TEXT;
BEGIN
  -- Check if product exists and is active
  SELECT EXISTS(
    SELECT 1 FROM products WHERE id = NEW.product_id
  ), (
    SELECT active FROM products WHERE id = NEW.product_id
  ), (
    SELECT name FROM products WHERE id = NEW.product_id
  ) INTO v_product_exists, v_product_active, v_product_name;
  
  IF NOT v_product_exists THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;
  
  IF NOT v_product_active THEN
    RAISE EXCEPTION 'Produto "%" está inativo e não pode ser usado em pedidos', v_product_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate customer exists and is active (for orders)
CREATE OR REPLACE FUNCTION validate_customer_in_order()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_exists BOOLEAN;
  v_customer_name TEXT;
BEGIN
  -- Allow NULL customer (walk-in sales)
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if customer exists
  SELECT EXISTS(
    SELECT 1 FROM customers WHERE id = NEW.customer_id
  ), (
    SELECT name FROM customers WHERE id = NEW.customer_id
  ) INTO v_customer_exists, v_customer_name;
  
  IF NOT v_customer_exists THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate supplier exists (for purchases)
CREATE OR REPLACE FUNCTION validate_supplier_in_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_supplier_exists BOOLEAN;
  v_supplier_active BOOLEAN;
  v_supplier_name TEXT;
BEGIN
  -- Allow NULL supplier
  IF NEW.supplier_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if supplier exists and is active
  SELECT EXISTS(
    SELECT 1 FROM suppliers WHERE id = NEW.supplier_id
  ), (
    SELECT is_active FROM suppliers WHERE id = NEW.supplier_id
  ), (
    SELECT name FROM suppliers WHERE id = NEW.supplier_id
  ) INTO v_supplier_exists, v_supplier_active, v_supplier_name;
  
  IF NOT v_supplier_exists THEN
    RAISE EXCEPTION 'Fornecedor não encontrado';
  END IF;
  
  IF NOT v_supplier_active THEN
    RAISE EXCEPTION 'Fornecedor "%" está inativo', v_supplier_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate bank account in financial entries
CREATE OR REPLACE FUNCTION validate_bank_account_in_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_account_exists BOOLEAN;
  v_account_active BOOLEAN;
  v_account_name TEXT;
BEGIN
  -- Allow NULL bank account (not settled yet)
  IF NEW.bank_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if bank account exists and is active
  SELECT EXISTS(
    SELECT 1 FROM bank_accounts WHERE id = NEW.bank_account_id
  ), (
    SELECT is_active FROM bank_accounts WHERE id = NEW.bank_account_id
  ), (
    SELECT bank_name FROM bank_accounts WHERE id = NEW.bank_account_id
  ) INTO v_account_exists, v_account_active, v_account_name;
  
  IF NOT v_account_exists THEN
    RAISE EXCEPTION 'Conta bancária não encontrada';
  END IF;
  
  IF NOT v_account_active THEN
    RAISE EXCEPTION 'Conta bancária "%" está inativa', v_account_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate payment method
CREATE OR REPLACE FUNCTION validate_payment_method()
RETURNS TRIGGER AS $$
DECLARE
  v_method_exists BOOLEAN;
  v_method_active BOOLEAN;
  v_method_name TEXT;
BEGIN
  -- Allow NULL payment method
  IF NEW.payment_method_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if payment method exists and is active
  SELECT EXISTS(
    SELECT 1 FROM payment_methods WHERE id = NEW.payment_method_id
  ), (
    SELECT active FROM payment_methods WHERE id = NEW.payment_method_id
  ), (
    SELECT name FROM payment_methods WHERE id = NEW.payment_method_id
  ) INTO v_method_exists, v_method_active, v_method_name;
  
  IF NOT v_method_exists THEN
    RAISE EXCEPTION 'Forma de pagamento não encontrada';
  END IF;
  
  IF NOT v_method_active THEN
    RAISE EXCEPTION 'Forma de pagamento "%" está inativa', v_method_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate company exists and is active
CREATE OR REPLACE FUNCTION validate_company()
RETURNS TRIGGER AS $$
DECLARE
  v_company_exists BOOLEAN;
  v_company_active BOOLEAN;
  v_company_name TEXT;
BEGIN
  -- Allow NULL company
  IF NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if company exists and is active
  SELECT EXISTS(
    SELECT 1 FROM companies WHERE id = NEW.company_id
  ), (
    SELECT is_active FROM companies WHERE id = NEW.company_id
  ), (
    SELECT name FROM companies WHERE id = NEW.company_id
  ) INTO v_company_exists, v_company_active, v_company_name;
  
  IF NOT v_company_exists THEN
    RAISE EXCEPTION 'Empresa não encontrada';
  END IF;
  
  IF NOT v_company_active THEN
    RAISE EXCEPTION 'Empresa "%" está inativa', v_company_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent deletion of referenced products
CREATE OR REPLACE FUNCTION prevent_product_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_order_count INTEGER;
  v_movement_count INTEGER;
BEGIN
  -- Check if product is used in orders
  SELECT COUNT(*) INTO v_order_count
  FROM order_items
  WHERE product_id = OLD.id;
  
  IF v_order_count > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir produto "%" pois está vinculado a % pedido(s). Desative o produto ao invés de excluí-lo.', 
      OLD.name, v_order_count;
  END IF;
  
  -- Check if product has stock movements
  SELECT COUNT(*) INTO v_movement_count
  FROM stock_movements
  WHERE product_id = OLD.id;
  
  IF v_movement_count > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir produto "%" pois possui % movimentação(ões) de estoque. Desative o produto ao invés de excluí-lo.', 
      OLD.name, v_movement_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent deletion of referenced customers
CREATE OR REPLACE FUNCTION prevent_customer_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_order_count INTEGER;
  v_invoice_count INTEGER;
BEGIN
  -- Check if customer has orders
  SELECT COUNT(*) INTO v_order_count
  FROM orders
  WHERE customer_id = OLD.id;
  
  IF v_order_count > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir cliente "%" pois possui % pedido(s)', 
      OLD.name, v_order_count;
  END IF;
  
  -- Check if customer has invoices
  SELECT COUNT(*) INTO v_invoice_count
  FROM invoices
  WHERE customer_id = OLD.id;
  
  IF v_invoice_count > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir cliente "%" pois possui % fatura(s)', 
      OLD.name, v_invoice_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent deletion of referenced suppliers
CREATE OR REPLACE FUNCTION prevent_supplier_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_purchase_count INTEGER;
BEGIN
  -- Check if supplier has purchases
  SELECT COUNT(*) INTO v_purchase_count
  FROM purchases
  WHERE supplier_id = OLD.id;
  
  IF v_purchase_count > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir fornecedor "%" pois possui % compra(s). Desative o fornecedor ao invés de excluí-lo.', 
      OLD.name, v_purchase_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate warehouse exists
CREATE OR REPLACE FUNCTION validate_warehouse()
RETURNS TRIGGER AS $$
DECLARE
  v_warehouse_exists BOOLEAN;
  v_warehouse_active BOOLEAN;
  v_warehouse_name TEXT;
BEGIN
  -- Allow NULL warehouse
  IF NEW.warehouse_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if warehouse exists and is active
  SELECT EXISTS(
    SELECT 1 FROM warehouses WHERE id = NEW.warehouse_id
  ), (
    SELECT is_active FROM warehouses WHERE id = NEW.warehouse_id
  ), (
    SELECT name FROM warehouses WHERE id = NEW.warehouse_id
  ) INTO v_warehouse_exists, v_warehouse_active, v_warehouse_name;
  
  IF NOT v_warehouse_exists THEN
    RAISE EXCEPTION 'Depósito não encontrado';
  END IF;
  
  IF NOT v_warehouse_active THEN
    RAISE EXCEPTION 'Depósito "%" está inativo', v_warehouse_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to order_items
DROP TRIGGER IF EXISTS trigger_validate_product_in_order_item ON order_items;
CREATE TRIGGER trigger_validate_product_in_order_item
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_in_order();

-- Apply triggers to orders
DROP TRIGGER IF EXISTS trigger_validate_customer_in_order ON orders;
CREATE TRIGGER trigger_validate_customer_in_order
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_customer_in_order();

DROP TRIGGER IF EXISTS trigger_validate_company_in_order ON orders;
CREATE TRIGGER trigger_validate_company_in_order
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_company();

-- Apply triggers to purchases
DROP TRIGGER IF EXISTS trigger_validate_supplier_in_purchase ON purchases;
CREATE TRIGGER trigger_validate_supplier_in_purchase
  BEFORE INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION validate_supplier_in_purchase();

-- Apply triggers to financial_entries
DROP TRIGGER IF EXISTS trigger_validate_bank_account_in_entry ON financial_entries;
CREATE TRIGGER trigger_validate_bank_account_in_entry
  BEFORE INSERT OR UPDATE ON financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION validate_bank_account_in_entry();

DROP TRIGGER IF EXISTS trigger_validate_payment_method_in_entry ON financial_entries;
CREATE TRIGGER trigger_validate_payment_method_in_entry
  BEFORE INSERT OR UPDATE ON financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_method();

DROP TRIGGER IF EXISTS trigger_validate_company_in_entry ON financial_entries;
CREATE TRIGGER trigger_validate_company_in_entry
  BEFORE INSERT OR UPDATE ON financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION validate_company();

-- Apply triggers to stock_movements
DROP TRIGGER IF EXISTS trigger_validate_warehouse_in_movement ON stock_movements;
CREATE TRIGGER trigger_validate_warehouse_in_movement
  BEFORE INSERT OR UPDATE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION validate_warehouse();

DROP TRIGGER IF EXISTS trigger_validate_product_in_movement ON stock_movements;
CREATE TRIGGER trigger_validate_product_in_movement
  BEFORE INSERT OR UPDATE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_in_order();

-- Prevent deletion triggers
DROP TRIGGER IF EXISTS trigger_prevent_product_deletion ON products;
CREATE TRIGGER trigger_prevent_product_deletion
  BEFORE DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_product_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_customer_deletion ON customers;
CREATE TRIGGER trigger_prevent_customer_deletion
  BEFORE DELETE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION prevent_customer_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_supplier_deletion ON suppliers;
CREATE TRIGGER trigger_prevent_supplier_deletion
  BEFORE DELETE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION prevent_supplier_deletion();

-- Comments
COMMENT ON FUNCTION validate_product_in_order() IS 'Valida que produto existe e está ativo antes de usar em pedidos/movimentações';
COMMENT ON FUNCTION validate_customer_in_order() IS 'Valida que cliente existe antes de usar em pedidos';
COMMENT ON FUNCTION validate_supplier_in_purchase() IS 'Valida que fornecedor existe e está ativo antes de usar em compras';
COMMENT ON FUNCTION validate_bank_account_in_entry() IS 'Valida que conta bancária existe e está ativa antes de usar em lançamentos';
COMMENT ON FUNCTION validate_payment_method() IS 'Valida que forma de pagamento existe e está ativa';
COMMENT ON FUNCTION validate_company() IS 'Valida que empresa existe e está ativa';
COMMENT ON FUNCTION validate_warehouse() IS 'Valida que depósito existe e está ativo';
COMMENT ON FUNCTION prevent_product_deletion() IS 'Previne exclusão de produtos com pedidos ou movimentações';
COMMENT ON FUNCTION prevent_customer_deletion() IS 'Previne exclusão de clientes com pedidos ou faturas';
COMMENT ON FUNCTION prevent_supplier_deletion() IS 'Previne exclusão de fornecedores com compras';