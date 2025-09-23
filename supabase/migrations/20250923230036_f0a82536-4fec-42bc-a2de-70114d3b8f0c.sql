-- Create test data for inventory alerts
-- Update the existing product to have low stock
UPDATE public.products 
SET min_stock_level = 15, stock_quantity = 5
WHERE id = 'ac161d6f-90c2-4f3c-aa8d-04bdbe7cd7e5';

-- Insert some additional test products for different alert scenarios
INSERT INTO public.products (org_id, owner_id, name, stock_quantity, min_stock_level, active, unit_price, cost_price)
VALUES 
  ('3f4bd408-ed6f-4f6a-aec4-8276a8153a98', '4c261b62-4077-4622-af4a-409bb250cef2', 'Açúcar', 0, 10, true, 5.50, 3.00),
  ('3f4bd408-ed6f-4f6a-aec4-8276a8153a98', '4c261b62-4077-4622-af4a-409bb250cef2', 'Farinha de Trigo', 25, 20, true, 4.20, 2.80),
  ('3f4bd408-ed6f-4f6a-aec4-8276a8153a98', '4c261b62-4077-4622-af4a-409bb250cef2', 'Leite Integral', 8, 15, true, 3.80, 2.50);

-- Insert some product lots with near expiry dates for testing
INSERT INTO public.product_lots (org_id, product_id, lot_number, quantity, expiration_date, status, created_by)
VALUES 
  ('3f4bd408-ed6f-4f6a-aec4-8276a8153a98', 'ac161d6f-90c2-4f3c-aa8d-04bdbe7cd7e5', 'LOTE001', 5, '2025-09-25', 'active', '4c261b62-4077-4622-af4a-409bb250cef2'),
  ('3f4bd408-ed6f-4f6a-aec4-8276a8153a98', 
   (SELECT id FROM public.products WHERE name = 'Leite Integral' AND org_id = '3f4bd408-ed6f-4f6a-aec4-8276a8153a98'), 
   'LOTE002', 8, '2025-09-24', 'active', '4c261b62-4077-4622-af4a-409bb250cef2');