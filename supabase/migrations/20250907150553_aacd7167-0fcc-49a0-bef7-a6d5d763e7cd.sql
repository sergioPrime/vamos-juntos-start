-- Insert sample customers and suppliers for testing
-- First, get the first organization ID
WITH first_org AS (
  SELECT id as org_id FROM organizations LIMIT 1
),
first_user AS (
  SELECT id as user_id FROM profiles LIMIT 1
)

-- Insert sample customers
INSERT INTO customers (org_id, owner_id, name, document, email, phone)
SELECT 
  fo.org_id,
  fu.user_id,
  'Cliente Exemplo 1',
  '12345678901',
  'cliente1@exemplo.com',
  '11999999999'
FROM first_org fo, first_user fu
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE name = 'Cliente Exemplo 1'
);

WITH first_org AS (
  SELECT id as org_id FROM organizations LIMIT 1
),
first_user AS (
  SELECT id as user_id FROM profiles LIMIT 1
)

INSERT INTO customers (org_id, owner_id, name, document, email, phone)
SELECT 
  fo.org_id,
  fu.user_id,
  'Cliente Exemplo 2',
  '98765432100',
  'cliente2@exemplo.com',
  '11888888888'
FROM first_org fo, first_user fu
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE name = 'Cliente Exemplo 2'
);

-- Insert sample suppliers
WITH first_org AS (
  SELECT id as org_id FROM organizations LIMIT 1
),
first_user AS (
  SELECT id as user_id FROM profiles LIMIT 1
)

INSERT INTO suppliers (org_id, created_by, name, document, email, phone, supplier_type)
SELECT 
  fo.org_id,
  fu.user_id,
  'Fornecedor Exemplo 1',
  '11222333000144',
  'fornecedor1@exemplo.com',
  '11777777777',
  'vendor'
FROM first_org fo, first_user fu
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers WHERE name = 'Fornecedor Exemplo 1'
);

WITH first_org AS (
  SELECT id as org_id FROM organizations LIMIT 1
),
first_user AS (
  SELECT id as user_id FROM profiles LIMIT 1
)

INSERT INTO suppliers (org_id, created_by, name, document, email, phone, supplier_type)
SELECT 
  fo.org_id,
  fu.user_id,
  'Fornecedor Exemplo 2',
  '55666777000188',
  'fornecedor2@exemplo.com',
  '11666666666',
  'vendor'
FROM first_org fo, first_user fu
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers WHERE name = 'Fornecedor Exemplo 2'
);

-- Update existing customer that has null org_id
UPDATE customers 
SET org_id = (SELECT id FROM organizations LIMIT 1),
    owner_id = (SELECT id FROM profiles LIMIT 1)
WHERE org_id IS NULL;