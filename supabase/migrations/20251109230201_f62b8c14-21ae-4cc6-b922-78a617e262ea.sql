-- Add sales_category_id to fiscal_operations table
ALTER TABLE fiscal_operations
ADD COLUMN IF NOT EXISTS sales_category_id uuid REFERENCES sales_categories(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_fiscal_operations_sales_category ON fiscal_operations(sales_category_id);