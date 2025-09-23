-- Insert some product lots with near expiry dates for testing
INSERT INTO public.product_lots (org_id, product_id, lot_number, quantity, expiration_date, status, created_by)
SELECT 
  '3f4bd408-ed6f-4f6a-aec4-8276a8153a98',
  id,
  'LOTE-' || SUBSTRING(id::text, 1, 8),
  CASE 
    WHEN name = 'café' THEN 5
    WHEN name = 'Leite Integral UHT' THEN 8
    ELSE 3
  END,
  CASE 
    WHEN name = 'café' THEN '2025-09-25'::date
    WHEN name = 'Leite Integral UHT' THEN '2025-09-24'::date
    ELSE '2025-09-26'::date
  END,
  'active',
  '4c261b62-4077-4622-af4a-409bb250cef2'
FROM public.products 
WHERE org_id = '3f4bd408-ed6f-4f6a-aec4-8276a8153a98' 
AND active = true 
AND name IN ('café', 'Leite Integral UHT');