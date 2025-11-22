# 🗄️ MIGRAÇÕES DE BANCO DE DADOS PENDENTES

**Módulo:** Vendas - Comissões e Relatórios  
**Status:** Aguardando execução  
**Prioridade:** Alta

---

## 📋 Migrações Necessárias

### 1. Tabela de Comissões de Vendedores

```sql
-- Criar tabela de comissões
CREATE TABLE IF NOT EXISTS public.seller_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  base_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_seller_commissions_org_id ON public.seller_commissions(org_id);
CREATE INDEX idx_seller_commissions_seller_id ON public.seller_commissions(seller_id);
CREATE INDEX idx_seller_commissions_order_id ON public.seller_commissions(order_id);
CREATE INDEX idx_seller_commissions_status ON public.seller_commissions(status);
CREATE INDEX idx_seller_commissions_created_at ON public.seller_commissions(created_at DESC);

-- RLS Policies
ALTER TABLE public.seller_commissions ENABLE ROW LEVEL SECURITY;

-- Vendedores podem ver suas próprias comissões
CREATE POLICY "seller_view_own_commissions" ON public.seller_commissions
  FOR SELECT
  USING (
    auth.uid() = seller_id
    OR org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Gestores podem aprovar comissões
CREATE POLICY "managers_approve_commissions" ON public.seller_commissions
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Sistema pode criar comissões
CREATE POLICY "system_create_commissions" ON public.seller_commissions
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_seller_commissions_updated_at
  BEFORE UPDATE ON public.seller_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.seller_commissions IS 'Comissões de vendedores calculadas automaticamente';
COMMENT ON COLUMN public.seller_commissions.commission_type IS 'Tipo: percentage (%), fixed (R$), tiered (escalonado)';
COMMENT ON COLUMN public.seller_commissions.status IS 'Status: pending, approved, paid, cancelled';
```

### 2. Tabela de Regras de Comissão

```sql
-- Criar tabela de regras de comissão
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('product', 'category', 'seller', 'global')),
  target_id UUID, -- ID do produto, categoria ou vendedor
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_value NUMERIC(10, 2) NOT NULL,
  min_amount NUMERIC(15, 2),
  max_amount NUMERIC(15, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_commission_rules_org_id ON public.commission_rules(org_id);
CREATE INDEX idx_commission_rules_rule_type ON public.commission_rules(rule_type);
CREATE INDEX idx_commission_rules_target_id ON public.commission_rules(target_id);
CREATE INDEX idx_commission_rules_is_active ON public.commission_rules(is_active);
CREATE INDEX idx_commission_rules_priority ON public.commission_rules(priority DESC);

-- RLS Policies
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_manage_commission_rules" ON public.commission_rules
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_commission_rules_updated_at
  BEFORE UPDATE ON public.commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.commission_rules IS 'Regras configuráveis de comissionamento';
COMMENT ON COLUMN public.commission_rules.priority IS 'Maior prioridade é aplicada primeiro';
```

### 3. Tabela de Metas de Vendedores

```sql
-- Criar tabela de metas
CREATE TABLE IF NOT EXISTS public.seller_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal_amount NUMERIC(15, 2) NOT NULL,
  achieved_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  bonus_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_seller_goals_org_id ON public.seller_goals(org_id);
CREATE INDEX idx_seller_goals_seller_id ON public.seller_goals(seller_id);
CREATE INDEX idx_seller_goals_period ON public.seller_goals(start_date, end_date);
CREATE INDEX idx_seller_goals_status ON public.seller_goals(status);

-- RLS Policies
ALTER TABLE public.seller_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seller_view_own_goals" ON public.seller_goals
  FOR SELECT
  USING (
    auth.uid() = seller_id
    OR org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "managers_manage_goals" ON public.seller_goals
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_seller_goals_updated_at
  BEFORE UPDATE ON public.seller_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.seller_goals IS 'Metas de vendas para vendedores';
COMMENT ON COLUMN public.seller_goals.bonus_percentage IS 'Percentual de bônus ao atingir meta';
```

### 4. Functions para Relatórios

```sql
-- Função para calcular vendas por período
CREATE OR REPLACE FUNCTION public.get_sales_by_period(
  p_org_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_group_by TEXT DEFAULT 'day'
)
RETURNS TABLE (
  period_date DATE,
  total_amount NUMERIC,
  order_count BIGINT,
  avg_ticket NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as period_date,
    SUM(total_amount) as total_amount,
    COUNT(*)::BIGINT as order_count,
    AVG(total_amount) as avg_ticket
  FROM public.orders
  WHERE 
    org_id = p_org_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND status = 'completed'
  GROUP BY DATE(created_at)
  ORDER BY period_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para top produtos
CREATE OR REPLACE FUNCTION public.get_top_products(
  p_org_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  quantity_sold NUMERIC,
  total_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_id,
    p.name as product_name,
    SUM(oi.quantity) as quantity_sold,
    SUM(oi.total) as total_amount
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  JOIN public.products p ON p.id = oi.product_id
  WHERE 
    o.org_id = p_org_id
    AND o.status = 'completed'
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  GROUP BY oi.product_id, p.name
  ORDER BY total_amount DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para performance de vendedores
CREATE OR REPLACE FUNCTION public.get_seller_performance(
  p_org_id UUID,
  p_seller_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  seller_id UUID,
  seller_name TEXT,
  order_count BIGINT,
  total_amount NUMERIC,
  avg_ticket NUMERIC,
  commission_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.seller_id,
    prof.full_name as seller_name,
    COUNT(*)::BIGINT as order_count,
    SUM(o.total_amount) as total_amount,
    AVG(o.total_amount) as avg_ticket,
    COALESCE(SUM(sc.commission_amount), 0) as commission_total
  FROM public.orders o
  JOIN public.profiles prof ON prof.id = o.seller_id
  LEFT JOIN public.seller_commissions sc ON sc.order_id = o.id
  WHERE 
    o.org_id = p_org_id
    AND o.status = 'completed'
    AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
  GROUP BY o.seller_id, prof.full_name
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Trigger para Criar Comissão Automaticamente

```sql
-- Trigger function para criar comissão ao finalizar pedido
CREATE OR REPLACE FUNCTION public.create_commission_on_order_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate NUMERIC := 5; -- Taxa padrão 5%
  v_commission_amount NUMERIC;
BEGIN
  -- Só cria comissão se status mudou para 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Busca regra de comissão aplicável
    SELECT commission_value INTO v_commission_rate
    FROM public.commission_rules
    WHERE 
      org_id = NEW.org_id
      AND is_active = true
      AND (
        (rule_type = 'seller' AND target_id = NEW.seller_id)
        OR (rule_type = 'global')
      )
    ORDER BY priority DESC
    LIMIT 1;
    
    -- Se não encontrou, usa taxa padrão
    v_commission_rate := COALESCE(v_commission_rate, 5);
    
    -- Calcula comissão
    v_commission_amount := NEW.total_amount * (v_commission_rate / 100);
    
    -- Insere registro de comissão
    INSERT INTO public.seller_commissions (
      org_id,
      seller_id,
      order_id,
      commission_type,
      commission_rate,
      commission_amount,
      base_amount,
      status
    ) VALUES (
      NEW.org_id,
      NEW.seller_id,
      NEW.id,
      'percentage',
      v_commission_rate,
      v_commission_amount,
      NEW.total_amount,
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_create_commission ON public.orders;
CREATE TRIGGER trigger_create_commission
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_commission_on_order_complete();
```

---

## 🚀 Como Executar as Migrações

### Opção 1: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e cole cada bloco SQL
4. Execute um por vez
5. Verifique se não há erros

### Opção 2: Via Supabase CLI

```bash
# Criar arquivo de migração
supabase migration new add_commissions_system

# Copiar o SQL para o arquivo criado
# Arquivo estará em: supabase/migrations/[timestamp]_add_commissions_system.sql

# Aplicar migração
supabase db push
```

### Opção 3: Via Migration Tool (Recomendado)

```typescript
// Usar o hook de migração do próprio sistema
import { supabase } from '@/integrations/supabase/client';

const runMigrations = async () => {
  // Executar cada bloco de SQL
  const migrations = [
    // SQL da tabela seller_commissions
    // SQL da tabela commission_rules
    // SQL da tabela seller_goals
    // SQL das functions
    // SQL dos triggers
  ];
  
  for (const migration of migrations) {
    const { error } = await supabase.rpc('exec_sql', {
      sql: migration
    });
    
    if (error) {
      console.error('Migration error:', error);
      break;
    }
  }
};
```

---

## ✅ Checklist de Verificação

Após executar as migrações:

### Tabelas
- [ ] seller_commissions criada
- [ ] commission_rules criada
- [ ] seller_goals criada
- [ ] Todos os índices criados
- [ ] Todas as constraints funcionando

### RLS Policies
- [ ] Vendedor pode ver próprias comissões
- [ ] Gestor pode aprovar comissões
- [ ] Vendedor pode ver próprias metas
- [ ] Gestor pode gerenciar metas

### Functions
- [ ] get_sales_by_period funcionando
- [ ] get_top_products funcionando
- [ ] get_seller_performance funcionando

### Triggers
- [ ] Comissão criada automaticamente ao finalizar pedido
- [ ] updated_at atualizado em todas as tabelas

### Testes
- [ ] Criar pedido e verificar comissão gerada
- [ ] Aprovar comissão
- [ ] Criar regra de comissão
- [ ] Criar meta de vendedor
- [ ] Executar relatórios

---

## 🧪 Scripts de Teste

```sql
-- Teste 1: Criar regra de comissão padrão
INSERT INTO public.commission_rules (
  org_id,
  rule_name,
  rule_type,
  commission_type,
  commission_value,
  is_active,
  priority
) VALUES (
  'YOUR_ORG_ID',
  'Comissão Padrão 5%',
  'global',
  'percentage',
  5.00,
  true,
  0
);

-- Teste 2: Verificar comissões pendentes
SELECT 
  sc.*,
  o.number as order_number,
  prof.full_name as seller_name
FROM seller_commissions sc
JOIN orders o ON o.id = sc.order_id
JOIN profiles prof ON prof.id = sc.seller_id
WHERE sc.status = 'pending';

-- Teste 3: Aprovar comissão
UPDATE seller_commissions
SET 
  status = 'approved',
  approved_by = 'YOUR_USER_ID',
  approved_at = NOW()
WHERE id = 'COMMISSION_ID';

-- Teste 4: Executar relatório de vendas
SELECT * FROM get_sales_by_period(
  'YOUR_ORG_ID',
  '2025-01-01',
  '2025-12-31',
  'day'
);
```

---

## 📊 Dados Iniciais (Seed)

```sql
-- Criar regras de comissão padrão para todas as organizações
INSERT INTO public.commission_rules (org_id, rule_name, rule_type, commission_type, commission_value, is_active, priority)
SELECT 
  id as org_id,
  'Comissão Padrão 5%' as rule_name,
  'global' as rule_type,
  'percentage' as commission_type,
  5.00 as commission_value,
  true as is_active,
  0 as priority
FROM public.organizations
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_rules cr
  WHERE cr.org_id = organizations.id
  AND cr.rule_type = 'global'
);
```

---

## 🔒 Segurança

### Verificações Implementadas
- ✅ RLS habilitado em todas as tabelas
- ✅ Policies para cada nível de acesso
- ✅ Functions com SECURITY DEFINER
- ✅ Validações em CHECK constraints
- ✅ Foreign keys para integridade

### Recomendações
- Sempre testar em ambiente de desenvolvimento primeiro
- Fazer backup antes de executar em produção
- Monitorar logs após execução
- Validar permissões de cada usuário

---

## 📝 Notas Importantes

1. **Ordem de Execução**: Siga a ordem apresentada
2. **Dependências**: Certifique-se que tabelas dependentes existem
3. **Performance**: Índices são críticos para performance
4. **Auditoria**: Todas as operações são rastreáveis
5. **Rollback**: Mantenha scripts de rollback prontos

---

## 🆘 Troubleshooting

### Erro: "relation already exists"
```sql
-- Usar IF NOT EXISTS ou DROP primeiro
DROP TABLE IF EXISTS public.seller_commissions CASCADE;
```

### Erro: "foreign key constraint"
```sql
-- Verificar se tabelas referenciadas existem
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'organizations');
```

### Erro: "function does not exist"
```sql
-- Verificar se função update_updated_at_column existe
SELECT proname FROM pg_proc 
WHERE proname = 'update_updated_at_column';
```

---

## ✅ Status Final

- **Migrações Documentadas**: ✅
- **Scripts Testados**: ⏳ Pendente
- **Rollback Preparado**: ⏳ Pendente
- **Documentação**: ✅ Completa

**Pronto para Execução**: ⚠️ Aguardando aprovação e testes

---

**Última Atualização:** 2025-11-22
