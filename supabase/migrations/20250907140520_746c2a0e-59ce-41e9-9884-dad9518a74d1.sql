-- Fix security issues by properly setting up views with RLS
DROP VIEW IF EXISTS analytical_accounts;
DROP VIEW IF EXISTS financial_entries_report;

-- Create RLS policies for the views to work correctly
-- First enable RLS on the views if not already enabled (this is handled by the table policies)

-- Create analytical accounts view with proper security
CREATE OR REPLACE VIEW analytical_accounts AS
SELECT * FROM chart_of_accounts 
WHERE account_type = 'analytic' 
  AND is_active = true
  AND org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  );

-- Create financial entries report view with proper security
CREATE OR REPLACE VIEW financial_entries_report AS
SELECT 
  fe.*,
  coa.account_code,
  coa.account_name,
  cc.code as cost_center_code,
  cc.name as cost_center_name,
  c.name as company_name,
  CASE 
    WHEN fe.person_type = 'customer' THEN cust.name
    WHEN fe.person_type = 'supplier' THEN supp.name
  END as person_name
FROM financial_entries fe
LEFT JOIN chart_of_accounts coa ON fe.chart_of_account_id = coa.id
LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
LEFT JOIN companies c ON fe.company_id = c.id
LEFT JOIN customers cust ON fe.person_id = cust.id AND fe.person_type = 'customer'
LEFT JOIN suppliers supp ON fe.person_id = supp.id AND fe.person_type = 'supplier'
WHERE fe.org_id IN (
  SELECT org_id FROM user_organizations 
  WHERE user_id = auth.uid()
);