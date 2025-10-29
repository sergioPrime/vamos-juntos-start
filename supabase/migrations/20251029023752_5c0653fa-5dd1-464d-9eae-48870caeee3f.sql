-- Corrigir função check_low_stock_alert para retornar tipos corretos
DROP FUNCTION IF EXISTS check_low_stock_alert();

CREATE OR REPLACE FUNCTION public.check_low_stock_alert()
 RETURNS TABLE(
   product_id uuid, 
   product_name text, 
   current_stock numeric, 
   min_stock numeric, 
   reorder_point numeric, 
   org_id uuid
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    COALESCE(p.stock_quantity, 0::numeric),
    COALESCE(p.min_stock_level, 0::numeric),
    COALESCE(p.reorder_point, 0::numeric),
    p.org_id
  FROM products p
  WHERE p.track_stock = true
    AND p.active = true
    AND (
      (p.min_stock_level IS NOT NULL AND p.stock_quantity <= p.min_stock_level)
      OR (p.reorder_point IS NOT NULL AND p.stock_quantity <= p.reorder_point)
    )
  ORDER BY p.stock_quantity ASC;
END;
$function$;

COMMENT ON FUNCTION check_low_stock_alert() IS 'Retorna produtos com estoque baixo - CORRIGIDO tipo de retorno em 2025-10-29';