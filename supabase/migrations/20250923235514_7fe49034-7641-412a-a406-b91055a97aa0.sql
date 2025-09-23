-- Primeiro, deletar todas as dependências dos produtos
DELETE FROM public.stock_movements WHERE product_id IN (SELECT id FROM public.products);
DELETE FROM public.product_lots WHERE product_id IN (SELECT id FROM public.products);
DELETE FROM public.product_serials WHERE product_id IN (SELECT id FROM public.products);
DELETE FROM public.product_warehouse_stock WHERE product_id IN (SELECT id FROM public.products);
DELETE FROM public.order_items WHERE product_id IN (SELECT id FROM public.products);

-- Deletar todos os produtos
DELETE FROM public.products;

-- Alterar a coluna SKU para ser obrigatória e única
ALTER TABLE public.products 
ALTER COLUMN sku SET NOT NULL,
ADD CONSTRAINT products_sku_org_unique UNIQUE (sku, org_id);

-- Criar índice para melhor performance nas consultas por SKU
CREATE INDEX IF NOT EXISTS idx_products_sku_org ON public.products(sku, org_id);