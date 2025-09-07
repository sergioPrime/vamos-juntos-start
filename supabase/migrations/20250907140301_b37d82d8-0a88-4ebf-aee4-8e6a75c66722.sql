-- Add database constraints and indexes for chart_of_accounts
ALTER TABLE chart_of_accounts 
  ADD CONSTRAINT unique_org_account_code UNIQUE (org_id, account_code);

CREATE INDEX idx_chart_of_accounts_org_id ON chart_of_accounts(org_id);
CREATE INDEX idx_chart_of_accounts_parent_id ON chart_of_accounts(parent_id);
CREATE INDEX idx_chart_of_accounts_account_type ON chart_of_accounts(account_type);

-- Add database constraints and indexes for cost_centers
ALTER TABLE cost_centers 
  ADD CONSTRAINT unique_org_cost_center_code UNIQUE (org_id, code);

CREATE INDEX idx_cost_centers_org_id ON cost_centers(org_id);
CREATE INDEX idx_cost_centers_parent_id ON cost_centers(parent_id);

-- Add foreign key constraints for financial_entries
ALTER TABLE financial_entries 
  ADD CONSTRAINT fk_financial_entries_chart_of_account 
  FOREIGN KEY (chart_of_account_id) REFERENCES chart_of_accounts(id);

ALTER TABLE financial_entries 
  ADD CONSTRAINT fk_financial_entries_cost_center 
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id);

-- Create indexes for financial_entries for better performance
CREATE INDEX idx_financial_entries_org_id ON financial_entries(org_id);
CREATE INDEX idx_financial_entries_chart_of_account_id ON financial_entries(chart_of_account_id);
CREATE INDEX idx_financial_entries_cost_center_id ON financial_entries(cost_center_id);
CREATE INDEX idx_financial_entries_due_date ON financial_entries(due_date);
CREATE INDEX idx_financial_entries_entry_type ON financial_entries(entry_type);
CREATE INDEX idx_financial_entries_is_settled ON financial_entries(is_settled);

-- Create a view for analytical accounts only (for reporting)
CREATE OR REPLACE VIEW analytical_accounts AS
SELECT * FROM chart_of_accounts 
WHERE account_type = 'analytic' AND is_active = true;

-- Create a view for financial entries with related data (for reporting)
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
LEFT JOIN suppliers supp ON fe.person_id = supp.id AND fe.person_type = 'supplier';