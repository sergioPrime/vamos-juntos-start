-- Habilitar RLS na tabela transaction_audit
ALTER TABLE public.transaction_audit ENABLE ROW LEVEL SECURITY;

-- Política para visualização: apenas admins e superadmins podem ver logs de auditoria
CREATE POLICY "Admins can view audit logs"
ON public.transaction_audit
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Política para inserção: qualquer usuário autenticado pode criar logs (via triggers)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.transaction_audit
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Criar triggers de auditoria nas tabelas críticas

-- 1. Auditoria de Pedidos (Orders)
CREATE TRIGGER audit_orders_changes
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('ORDER_MANAGEMENT');

-- 2. Auditoria de Lançamentos Financeiros
CREATE TRIGGER audit_financial_entries_changes
AFTER INSERT OR UPDATE OR DELETE ON public.financial_entries
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('FINANCIAL_ENTRY');

-- 3. Auditoria de Movimentações de Estoque
CREATE TRIGGER audit_stock_movements_changes
AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('STOCK_MOVEMENT');

-- 4. Auditoria de Compras
CREATE TRIGGER audit_purchases_changes
AFTER INSERT OR UPDATE OR DELETE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('PURCHASE');

-- 5. Auditoria de Clientes/Fornecedores (Pessoas)
CREATE TRIGGER audit_pessoas_changes
AFTER INSERT OR UPDATE OR DELETE ON public.pessoas
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('CUSTOMER_SUPPLIER');

-- 6. Auditoria de Produtos
CREATE TRIGGER audit_products_changes
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('PRODUCT');

-- 7. Auditoria de Sessões de Caixa (PDV)
CREATE TRIGGER audit_caixa_sessoes_changes
AFTER INSERT OR UPDATE OR DELETE ON public.caixa_sessoes
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('PDV_SESSION');

-- 8. Auditoria de Movimentações de Caixa
CREATE TRIGGER audit_caixa_movimentacoes_changes
AFTER INSERT OR UPDATE OR DELETE ON public.caixa_movimentacoes
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('PDV_MOVEMENT');

-- 9. Auditoria de Permissões de Módulo
CREATE TRIGGER audit_module_permissions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('MODULE_PERMISSION');

-- 10. Auditoria de Contas Bancárias
CREATE TRIGGER audit_bank_accounts_changes
AFTER INSERT OR UPDATE OR DELETE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.audit_transaction('BANK_ACCOUNT');

-- Índices para melhorar performance das consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_transaction_audit_org_id ON public.transaction_audit(org_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_user_id ON public.transaction_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_created_at ON public.transaction_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_transaction_type ON public.transaction_audit(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_action_type ON public.transaction_audit(action_type);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_table_name ON public.transaction_audit(table_name);