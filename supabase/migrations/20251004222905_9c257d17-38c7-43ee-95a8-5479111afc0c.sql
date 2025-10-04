-- Add commission configuration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dia_vencimento_comissoes_pdv integer CHECK (dia_vencimento_comissoes_pdv >= 1 AND dia_vencimento_comissoes_pdv <= 31),
ADD COLUMN comissao_por_produto_pdv boolean DEFAULT false,
ADD COLUMN comissao_pdv_percentual numeric(5,2) DEFAULT 0 CHECK (comissao_pdv_percentual >= 0 AND comissao_pdv_percentual <= 100),
ADD COLUMN comissao_por_produto_pedidos boolean DEFAULT false,
ADD COLUMN comissao_pedidos_percentual numeric(5,2) DEFAULT 0 CHECK (comissao_pedidos_percentual >= 0 AND comissao_pedidos_percentual <= 100);