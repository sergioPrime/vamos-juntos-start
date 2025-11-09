
-- Fix SECURITY DEFINER views by explicitly setting security_invoker=on
-- This ensures views don't bypass RLS policies

-- Drop and recreate all views with security_invoker=on

-- 1. Analytical accounts view
DROP VIEW IF EXISTS public.analytical_accounts;
CREATE OR REPLACE VIEW public.analytical_accounts
WITH (security_invoker=on)
AS
SELECT 
  id,
  org_id,
  account_code,
  account_name,
  description,
  nature_code,
  is_expense,
  parent_id,
  created_at,
  updated_at
FROM chart_of_accounts 
WHERE account_type = 'analytic' AND is_active = true;

-- 2. Financial entries report view
DROP VIEW IF EXISTS public.financial_entries_report;
CREATE OR REPLACE VIEW public.financial_entries_report
WITH (security_invoker=on)
AS
SELECT 
  fe.id,
  fe.org_id,
  fe.company_id,
  fe.person_id,
  fe.person_type,
  fe.entry_type,
  fe.chart_of_account_id,
  fe.cost_center_id,
  fe.amount,
  fe.competence_date,
  fe.due_date,
  fe.is_settled,
  fe.settled_at,
  fe.description,
  fe.origin_type,
  fe.origin_id,
  fe.created_by,
  fe.created_at,
  fe.updated_at,
  fe.bank_account_id,
  fe.payment_method_id,
  fe.settled_payment_method_id,
  coa.account_code,
  coa.account_name,
  coa.nature_code,
  coa.is_expense,
  cc.code as cost_center_code,
  cc.name as cost_center_name,
  comp.name as company_name,
  CASE 
    WHEN fe.person_type = 'customer' THEN cust.name
    WHEN fe.person_type = 'supplier' THEN supp.name
    ELSE NULL
  END as person_name
FROM financial_entries fe
LEFT JOIN chart_of_accounts coa ON fe.chart_of_account_id = coa.id
LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
LEFT JOIN companies comp ON fe.company_id = comp.id
LEFT JOIN customers cust ON fe.person_type = 'customer' AND fe.person_id = cust.id
LEFT JOIN suppliers supp ON fe.person_type = 'supplier' AND fe.person_id = supp.id;

-- 3. Sales integrity check view
DROP VIEW IF EXISTS public.sales_integrity_check;
CREATE OR REPLACE VIEW public.sales_integrity_check
WITH (security_invoker=on)
AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.payment_status,
  o.total_amount as declared_total,
  COALESCE(SUM(oi.total_price), 0) as calculated_total,
  ABS(o.total_amount - COALESCE(SUM(oi.total_price), 0)) as value_difference,
  COUNT(oi.id) as items_count,
  COUNT(sm.id) as stock_movements_count,
  COUNT(fe.id) as financial_entries_count,
  CASE 
    WHEN COUNT(oi.id) = 0 THEN 'NO_ITEMS'
    WHEN ABS(o.total_amount - COALESCE(SUM(oi.total_price), 0)) > 0.01 THEN 'VALUE_MISMATCH'
    WHEN o.status IN ('completed', 'confirmed', 'processing') AND COUNT(sm.id) = 0 THEN 'NO_STOCK_MOVEMENT'
    WHEN o.payment_status = 'paid' AND COUNT(fe.id) = 0 THEN 'NO_FINANCIAL_ENTRY'
    ELSE 'OK'
  END as status_check,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN stock_movements sm ON sm.reference_type = 'order' AND sm.reference_id = o.id
LEFT JOIN financial_entries fe ON fe.origin_type = 'order' AND fe.origin_id = o.id
WHERE o.created_at > NOW() - INTERVAL '30 days'
GROUP BY o.id, o.order_number, o.status, o.payment_status, o.total_amount, o.created_at
ORDER BY o.created_at DESC;

-- 4. Sales sync statistics view
DROP VIEW IF EXISTS public.sales_sync_statistics;
CREATE OR REPLACE VIEW public.sales_sync_statistics
WITH (security_invoker=on)
AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE o.status IN ('completed', 'confirmed', 'processing')) as processed_orders,
  COUNT(*) FILTER (WHERE o.payment_status = 'paid') as paid_orders,
  COUNT(DISTINCT CASE WHEN sm.id IS NOT NULL THEN o.id END) as orders_with_stock_sync,
  COUNT(DISTINCT CASE WHEN fe.id IS NOT NULL THEN o.id END) as orders_with_financial_sync,
  ROUND(
    (COUNT(DISTINCT CASE WHEN sm.id IS NOT NULL THEN o.id END)::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE o.status IN ('completed', 'confirmed', 'processing')), 0)::NUMERIC) * 100, 
    2
  ) as stock_sync_percentage,
  ROUND(
    (COUNT(DISTINCT CASE WHEN fe.id IS NOT NULL THEN o.id END)::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE o.payment_status = 'paid'), 0)::NUMERIC) * 100, 
    2
  ) as financial_sync_percentage
FROM orders o
LEFT JOIN stock_movements sm ON sm.reference_type = 'order' AND sm.reference_id = o.id
LEFT JOIN financial_entries fe ON fe.origin_type = 'order' AND fe.origin_id = o.id
WHERE o.created_at > NOW() - INTERVAL '30 days';

-- 5. Stock integrity check view
DROP VIEW IF EXISTS public.stock_integrity_check;
CREATE OR REPLACE VIEW public.stock_integrity_check
WITH (security_invoker=on)
AS
SELECT 
  p.id,
  p.name,
  p.system_code,
  p.stock_quantity as declared_stock,
  COALESCE(SUM(
    CASE 
      WHEN sm.movement_type = 'in' THEN sm.quantity
      WHEN sm.movement_type = 'out' THEN -sm.quantity
      ELSE 0
    END
  ), 0) as calculated_stock,
  ABS(p.stock_quantity - COALESCE(SUM(
    CASE 
      WHEN sm.movement_type = 'in' THEN sm.quantity
      WHEN sm.movement_type = 'out' THEN -sm.quantity
      ELSE 0
    END
  ), 0)) as stock_difference,
  COUNT(sm.id) as movements_count,
  CASE 
    WHEN ABS(p.stock_quantity - COALESCE(SUM(
      CASE 
        WHEN sm.movement_type = 'in' THEN sm.quantity
        WHEN sm.movement_type = 'out' THEN -sm.quantity
        ELSE 0
      END
    ), 0)) > 0.01 THEN 'DIVERGENT'
    ELSE 'OK'
  END as status_check
FROM products p
LEFT JOIN stock_movements sm ON sm.product_id = p.id
WHERE p.track_stock = true
GROUP BY p.id, p.name, p.system_code, p.stock_quantity;

-- 6. Blockchain statistics view
DROP VIEW IF EXISTS public.blockchain_statistics;
CREATE OR REPLACE VIEW public.blockchain_statistics
WITH (security_invoker=on)
AS
SELECT 
  org_id,
  COUNT(*) as total_blocks,
  COUNT(*) FILTER (WHERE is_valid = true) as valid_blocks,
  COUNT(*) FILTER (WHERE is_valid = false) as invalid_blocks,
  MIN(timestamp) as first_block_date,
  MAX(timestamp) as last_block_date,
  COUNT(DISTINCT transaction_type) as transaction_types,
  COUNT(DISTINCT user_id) as unique_users
FROM blockchain_records
GROUP BY org_id;

COMMENT ON VIEW public.analytical_accounts IS 'View of analytical chart accounts with RLS enforcement via security_invoker';
COMMENT ON VIEW public.financial_entries_report IS 'Comprehensive financial entries report with RLS enforcement via security_invoker';
COMMENT ON VIEW public.sales_integrity_check IS 'Sales data integrity monitoring with RLS enforcement via security_invoker';
COMMENT ON VIEW public.sales_sync_statistics IS 'Sales synchronization statistics with RLS enforcement via security_invoker';
COMMENT ON VIEW public.stock_integrity_check IS 'Stock data integrity monitoring with RLS enforcement via security_invoker';
COMMENT ON VIEW public.blockchain_statistics IS 'Blockchain statistics aggregation with RLS enforcement via security_invoker';
