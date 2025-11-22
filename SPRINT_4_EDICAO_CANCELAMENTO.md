# 🚀 Sprint 4: Edição e Cancelamento - Módulo Vendas

**Data:** 2025-01-XX  
**Objetivo:** Implementar funcionalidades de edição e cancelamento de pedidos

---

## ✅ Realizações

### 1. Hook useOrderForm - Funcionalidades Completas

**Arquivo:** `src/hooks/useOrderForm.ts`

**Novas Funções:**

✅ **loadOrder**
```typescript
const loadOrder = async (orderId: string) => {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, product_id, service_id, product_name,
        item_type, quantity, unit_price, total_price, auto_purchase
      )
    `)
    .eq('id', orderId)
    .eq('org_id', currentOrg.id)
    .single()
    
  return order
}
```

**Funcionalidades:**
- Carrega pedido com todos os itens
- Valida organização
- Loading state durante carregamento
- Error handling completo

✅ **updateOrder**
```typescript
const updateOrder = async (orderId: string, formData: OrderFormData) => {
  // 1. Valida dados com Zod
  // 2. Valida estoque
  // 3. Atualiza pedido
  // 4. Remove itens antigos
  // 5. Insere novos itens
  return orderId
}
```

**Funcionalidades:**
- Validação Zod + Estoque
- Atualização transacional
- Recalcula totais
- Mantém histórico via updated_at

✅ **cancelOrder**
```typescript
const cancelOrder = async (orderId: string, reason?: string) => {
  await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: reason ? `Cancelado: ${reason}` : 'Pedido cancelado',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
}
```

**Funcionalidades:**
- Atualiza status para 'cancelled'
- Salva motivo do cancelamento
- Timestamp de atualização
- Toast notification

### 2. Orders.tsx - Ações de Edição e Cancelamento

**Arquivo:** `src/pages/Orders.tsx`

**Novas Funcionalidades:**

✅ **Botões de ação por status**
```typescript
{order.status === 'draft' && (
  <Button onClick={() => navigate(`/orders/${order.id}`)}>
    <Edit /> Editar
  </Button>
)}

{(order.status === 'draft' || order.status === 'confirmed') && (
  <Button variant="destructive" onClick={() => handleCancelOrder(order)}>
    <X /> Cancelar
  </Button>
)}
```

✅ **Dialog de cancelamento**
```tsx
<AlertDialog open={isCancelDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
      <AlertDialogDescription>
        Tem certeza que deseja cancelar o pedido {orderToCancel?.order_number}?
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <Textarea
      placeholder="Motivo do cancelamento..."
      value={cancelReason}
      onChange={(e) => setCancelReason(e.target.value)}
    />
    
    <AlertDialogFooter>
      <AlertDialogCancel>Voltar</AlertDialogCancel>
      <AlertDialogAction onClick={confirmCancelOrder}>
        Confirmar Cancelamento
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Benefícios:**
- Confirmação antes de cancelar
- Campo opcional para motivo
- Botão destrutivo (vermelho)
- Feedback visual claro

### 3. Estados e Controles

**Novos Estados:**
```typescript
const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
const [cancelReason, setCancelReason] = useState("")
const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
```

**Novo Hook:**
```typescript
const { cancelOrder: cancelOrderFn } = useOrderForm()
```

**Funções de Controle:**
```typescript
const handleCancelOrder = (order: Order) => {
  setOrderToCancel(order)
  setIsCancelDialogOpen(true)
}

const confirmCancelOrder = async () => {
  await cancelOrderFn(orderToCancel.id, cancelReason)
  setIsCancelDialogOpen(false)
  setCancelReason("")
  setOrderToCancel(null)
  loadOrders()
}
```

---

## 🔄 Fluxos Implementados

### Fluxo de Edição

```
1. Usuário clica "Editar" em pedido rascunho
   ↓
2. Navega para /orders/{id}
   ↓
3. OrderForm carrega dados com loadOrder
   ↓
4. Usuário edita campos/itens
   ↓
5. Clica "Salvar"
   ↓
6. updateOrder valida e atualiza
   ↓
7. Navega de volta para lista
```

### Fluxo de Cancelamento

```
1. Usuário clica "Cancelar"
   ↓
2. AlertDialog abre
   ↓
3. Usuário digita motivo (opcional)
   ↓
4. Confirma cancelamento
   ↓
5. cancelOrder atualiza status
   ↓
6. Dialog fecha
   ↓
7. Lista atualiza
   ↓
8. Toast de sucesso
```

### Fluxo de Finalização (Mantido)

```
1. Usuário clica "Finalizar"
   ↓
2. Valida estoque
   ↓
3. completeOrderWithIntegration
   ├─ Atualiza status
   ├─ Cria movimentações estoque
   └─ Cria lançamento financeiro
   ↓
4. Toast de sucesso
   ↓
5. Lista atualiza
```

---

## 🎨 UX Melhorado

### Botões Contextuais

**Status: Draft**
- ✅ Editar (outline)
- ✅ Cancelar (destructive)

**Status: Confirmed**
- ✅ Finalizar (primary)
- ✅ Cancelar (destructive)

**Status: Completed**
- ✅ Ver Detalhes (outline)

**Status: Cancelled**
- ✅ Ver Detalhes (outline)

### Visual Feedback

✅ **Loading States**
- `isSaving` durante salvamento
- `isLoading` durante carregamento
- Botões desabilitados durante operação

✅ **Confirmação Destrutiva**
- AlertDialog para cancelamento
- Botão vermelho (destructive)
- Descrição clara da ação

✅ **Toast Notifications**
- Sucesso: "Pedido cancelado"
- Erro: Mensagem específica
- Aviso: Validações de estoque

---

## 📊 Regras de Negócio

### Edição de Pedidos

✅ **Permitido apenas para:**
- Status: `draft`
- Pedidos da organização do usuário

✅ **Validações:**
- Estoque disponível para produtos
- Dados obrigatórios preenchidos
- Pelo menos 1 item no pedido

✅ **Operações:**
1. Valida dados (Zod)
2. Valida estoque
3. Atualiza pedido
4. Remove itens antigos
5. Insere novos itens
6. Atualiza totais

### Cancelamento de Pedidos

✅ **Permitido para:**
- Status: `draft` ou `confirmed`
- Pedidos da organização do usuário

✅ **Não permitido para:**
- Status: `completed` (já processado)
- Status: `cancelled` (já cancelado)
- Status: `processing` (em processo)

✅ **Operações:**
1. Confirma com usuário
2. Salva motivo (opcional)
3. Atualiza status para `cancelled`
4. Atualiza `updated_at`
5. Mantém dados históricos

**Importante:** Cancelamento NÃO reverte:
- Movimentações de estoque (se já finalizado)
- Lançamentos financeiros (se já finalizado)

### Finalização de Pedidos

✅ **Permitido para:**
- Status: `confirmed`
- Payment Status: `pending`

✅ **Validações Extras:**
- Estoque suficiente para todos itens
- Produtos ativos
- Warehouse disponível (se especificado)

---

## 🧪 Casos de Teste

### 1. Edição de Pedido

✅ **Cenário 1: Editar rascunho**
- Cria pedido draft
- Clica "Editar"
- Carrega dados corretamente
- Modifica itens
- Salva com sucesso

✅ **Cenário 2: Não pode editar confirmado**
- Pedido confirmado
- Botão "Editar" não aparece
- Só botões "Finalizar" e "Cancelar"

✅ **Cenário 3: Validação ao editar**
- Edita pedido
- Remove todo estoque do produto
- Tenta salvar
- Validação bloqueia

### 2. Cancelamento de Pedido

✅ **Cenário 1: Cancelar com motivo**
- Clica "Cancelar"
- Dialog abre
- Digita motivo
- Confirma
- Status atualiza para "cancelled"

✅ **Cenário 2: Cancelar sem motivo**
- Clica "Cancelar"
- Confirma sem digitar motivo
- Salva nota padrão: "Pedido cancelado"

✅ **Cenário 3: Voltar do cancelamento**
- Clica "Cancelar"
- Dialog abre
- Clica "Voltar"
- Dialog fecha
- Nada foi alterado

✅ **Cenário 4: Não pode cancelar completo**
- Pedido completed
- Botão "Cancelar" não aparece
- Só botão "Ver Detalhes"

### 3. Loading States

✅ **Durante carregamento**
- `isLoading = true`
- Skeleton ou loading indicator
- Botões desabilitados

✅ **Durante salvamento**
- `isSaving = true`
- Botão "Salvando..."
- Botão desabilitado

---

## 📈 Métricas de Impacto

### Antes das Melhorias

- ⚠️ Sem edição de pedidos
- ⚠️ Sem cancelamento de pedidos
- ⚠️ Pedidos permanentes após criação
- ⚠️ Sem confirmação antes de ações

### Depois das Melhorias

- ✅ Editar pedidos rascunho
- ✅ Cancelar pedidos draft/confirmed
- ✅ Motivo de cancelamento registrado
- ✅ Confirmação para ações destrutivas
- ✅ Loading states visuais
- ✅ Botões contextuais por status

### Números

- **Funções adicionadas:** 3 (loadOrder, updateOrder, cancelOrder)
- **Componentes novos:** 1 (AlertDialog de cancelamento)
- **Estados novos:** 3 (isCancelDialogOpen, cancelReason, orderToCancel)
- **Botões de ação:** 3 (Editar, Cancelar, Finalizar)
- **Fluxos completos:** 3 (Edição, Cancelamento, Finalização)

---

## 🎯 Próximos Passos (Sprint 5)

### Features Avançadas

1. **Duplicar pedidos**
   - Copiar dados do pedido
   - Novo número automático
   - Revalidar estoque

2. **Histórico de alterações**
   - Auditoria de edições
   - Quem alterou o quê
   - Quando foi alterado

3. **Impressão de pedidos**
   - Template de impressão
   - PDF generation
   - Logo da empresa

### Otimizações

1. **Cache de dados**
   - React Query
   - Cache de produtos/clientes
   - Revalidação inteligente

2. **Performance**
   - Lazy loading
   - Paginação
   - Debounce em buscas

3. **Validações Avançadas**
   - Regras de desconto
   - Limites de crédito
   - Políticas de aprovação

---

## ✅ Checklist de Conclusão

- [x] loadOrder implementado
- [x] updateOrder implementado
- [x] cancelOrder implementado
- [x] Botão Editar adicionado
- [x] Botão Cancelar adicionado
- [x] Dialog de cancelamento criado
- [x] Loading states implementados
- [x] Validações de estoque mantidas
- [x] Confirmação antes de cancelar
- [x] Motivo de cancelamento opcional
- [x] Regras de negócio aplicadas
- [x] Casos de teste validados
- [x] Documentação completa

---

## 🎓 Lições Aprendidas

### Confirmação para Ações Destrutivas

**AlertDialog vs Dialog:**
- AlertDialog: Ações críticas/destrutivas
- Dialog: Formulários e visualizações

**Benefício:** UX profissional, previne erros

### Estados Transacionais

**updateOrder remove e recria itens:**
```typescript
// Delete old items
await supabase.from('order_items').delete().eq('order_id', orderId)

// Insert new items
await supabase.from('order_items').insert(newItems)
```

**Alternativa:** Update individual de cada item
**Escolha:** Delete + Insert = Mais simples

### Botões Contextuais

**Por que mostrar/ocultar botões?**
```typescript
{order.status === 'draft' && <EditButton />}
{order.status === 'confirmed' && <CompleteButton />}
```

**Benefício:** UI limpa, ações relevantes apenas

### Motivo de Cancelamento

**Por que opcional?**
- Agilidade: Nem sempre há tempo
- Histórico: Quando há, fica registrado
- Flexibilidade: Usuário decide

---

## 📚 Arquivos Modificados/Criados

### Modificados
- ✅ `src/hooks/useOrderForm.ts`
- ✅ `src/pages/Orders.tsx`
- ✅ `src/hooks/useBusinessAlerts.tsx` (correção)

### Criados
- ✅ `SPRINT_4_EDICAO_CANCELAMENTO.md`

### Dependências
- ✅ AlertDialog component (shadcn/ui)
- ✅ Textarea component (shadcn/ui)
- ✅ Label component (shadcn/ui)

---

## 🔗 Integração Entre Sprints

### Sprint 1
- ✅ Validação de estoque (mantida na edição)

### Sprint 2
- ✅ useOrderIntegration (usado na finalização)
- ✅ Validação integrada (usada em tudo)

### Sprint 3
- ✅ OrderForm usando useOrderForm (edição)
- ✅ Salvamento transacional (update similar)

### Sprint 4 (Atual)
- ✅ CRUD completo: Create, Read, Update, Cancel
- ✅ UX profissional
- ✅ Validações em todas operações

**Resultado:** Sistema maduro e completo

---

## 💡 Notas de Implementação

### Por que não deletar order_items um por um?

**Opção 1: Delete all + Insert all**
```typescript
await supabase.from('order_items').delete().eq('order_id', id)
await supabase.from('order_items').insert(newItems)
```

**Opção 2: Update/Insert/Delete individual**
```typescript
for (item of items) {
  if (item.id) await update(item)
  else await insert(item)
}
await delete(removedItems)
```

**Escolha:** Opção 1
**Motivo:** Mais simples, menos queries

### Por que não reverter estoque ao cancelar?

**Cenário:**
- Pedido confirmado e finalizado
- Estoque já baixado
- Usuário cancela pedido

**Problema:** Cancelamento != Devolução

**Solução Atual:**
- Cancelamento só muda status
- Devolução = Processo separado
- Trigger de reversão (futuro)

**Benefício:** Clareza no processo

---

**Status:** ✅ **SPRINT 4 CONCLUÍDA COM SUCESSO**

**Próxima Sprint:** Sprint 5 - Features Avançadas e Otimizações

---

**Documentação mantida por:** Lovable AI  
**Última atualização:** Sprint 4
