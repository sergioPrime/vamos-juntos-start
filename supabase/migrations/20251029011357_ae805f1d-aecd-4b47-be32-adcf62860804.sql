-- Limpar registros órfãos antes de criar foreign keys

-- Remover registros de price_table_products que referenciam produtos inexistentes
DELETE FROM public.price_table_products
WHERE product_id NOT IN (SELECT id FROM public.products);

-- Remover registros de price_table_products que referenciam tabelas de preço inexistentes
DELETE FROM public.price_table_products
WHERE price_table_id NOT IN (SELECT id FROM public.price_tables);

-- Agora adicionar as foreign keys
ALTER TABLE public.price_table_products
  ADD CONSTRAINT price_table_products_product_id_fkey 
    FOREIGN KEY (product_id) 
    REFERENCES public.products(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT price_table_products_price_table_id_fkey 
    FOREIGN KEY (price_table_id) 
    REFERENCES public.price_tables(id) 
    ON DELETE CASCADE;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_price_table_products_product_id 
  ON public.price_table_products(product_id);
  
CREATE INDEX IF NOT EXISTS idx_price_table_products_price_table_id 
  ON public.price_table_products(price_table_id);

COMMENT ON TABLE public.price_table_products IS 'Relacionamento entre produtos e tabelas de preço com preços específicos';