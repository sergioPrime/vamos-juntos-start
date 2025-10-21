# Sprint 2.1 - Sistema de Parcelas ✅

## Objetivo
Implementar sistema completo de gestão de parcelas para lançamentos financeiros, permitindo parcelamento de contas a pagar e receber com controle individual de cada parcela.

## Implementações Realizadas

### 1. Estrutura de Banco de Dados

#### Tabela `financial_entry_installments`
Nova tabela para armazenar parcelas de lançamentos financeiros:

**Campos:**
- `id` - UUID único da parcela
- `org_id` - Organização (para RLS)
- `entry_id` - Referência ao lançamento principal
- `installment_number` - Número da parcela (1, 2, 3...)
- `total_installments` - Total de parcelas
- `due_date` - Data de vencimento
- `amount` - Valor da parcela
- `is_settled` - Se está quitada
- `settled_at` - Data da quitação
- `settled_amount` - Valor quitado
- `payment_method_id` - Forma de pagamento usada
- `bank_account_id` - Conta bancária da quitação
- `notes` - Observações
- `created_by` - Usuário que criou
- `created_at` / `updated_at` - Timestamps

**Constraints:**
- `valid_installment_number` - Valida que número da parcela é válido
- `valid_settled_data` - Garante consistência dos dados de quitação

**Índices:**
- `idx_installments_entry_id` - Busca por lançamento
- `idx_installments_org_id` - Filtro por organização
- `idx_installments_due_date` - Ordenação por vencimento
- `idx_installments_is_settled` - Filtro por status

### 2. Funções SQL Implementadas

#### `generate_installments()`
Gera parcelas automaticamente para um lançamento financeiro.

**Parâmetros:**
- `p_entry_id` - ID do lançamento
- `p_num_installments` - Quantidade de parcelas
- `p_first_due_date` - Data do primeiro vencimento
- `p_total_amount` - Valor total a parcelar
- `p_org_id` - ID da organização
- `p_created_by` - ID do usuário

**Funcionalidades:**
- Divide valor total em parcelas iguais
- Ajusta última parcela para cobrir diferenças de arredondamento
- Define vencimentos mensais automaticamente
- Retorna detalhes de cada parcela gerada

#### `settle_installment()`
Quita uma parcela específica.

**Parâmetros:**
- `p_installment_id` - ID da parcela
- `p_settled_amount` - Valor quitado
- `p_payment_method_id` - Forma de pagamento (opcional)
- `p_bank_account_id` - Conta bancária (opcional)

**Funcionalidades:**
- Marca parcela como quitada
- Registra valor, data e forma de pagamento
- Verifica se todas as parcelas foram quitadas
- Se sim, marca lançamento principal como quitado

#### `unsettle_installment()`
Cancela a quitação de uma parcela.

**Parâmetros:**
- `p_installment_id` - ID da parcela

**Funcionalidades:**
- Remove quitação da parcela
- Marca lançamento principal como não quitado

#### `get_installments_summary()`
Retorna resumo das parcelas de um lançamento.

**Parâmetros:**
- `p_entry_id` - ID do lançamento

**Retorna:**
- `total_installments` - Total de parcelas
- `settled_installments` - Parcelas quitadas
- `pending_installments` - Parcelas pendentes
- `total_amount` - Valor total
- `settled_amount` - Valor quitado
- `pending_amount` - Valor pendente
- `next_due_date` - Próximo vencimento

### 3. Triggers e Validações

#### `trigger_update_installment_updated_at`
Atualiza automaticamente o campo `updated_at` em modificações.

#### `trigger_prevent_settled_installment_deletion`
**Validação:** Impede exclusão de parcelas quitadas.
- Exige cancelamento da quitação primeiro
- Garante integridade do histórico financeiro

### 4. Políticas RLS

**Política:** "Users can manage installments from their organization"
- Aplica-se a: SELECT, INSERT, UPDATE, DELETE
- Permite acesso apenas a parcelas da organização do usuário

### 5. Hook React: `useInstallments`

Novo hook para gerenciamento de parcelas no frontend.

**Estado:**
- `installments` - Lista de parcelas
- `loading` - Status de carregamento

**Funções:**

#### `loadInstallments(entryId: string)`
Carrega todas as parcelas de um lançamento.

#### `generateInstallments(params: GenerateInstallmentsParams)`
Gera parcelas para um lançamento.
```typescript
interface GenerateInstallmentsParams {
  entryId: string;
  numInstallments: number;
  firstDueDate: string;
  totalAmount: number;
}
```

#### `settleInstallment()`
Quita uma parcela específica.
```typescript
settleInstallment(
  installmentId: string,
  settledAmount: number,
  paymentMethodId?: string,
  bankAccountId?: string
): Promise<boolean>
```

#### `unsettleInstallment(installmentId: string)`
Cancela quitação de uma parcela.

#### `getInstallmentsSummary(entryId: string)`
Obtém resumo das parcelas de um lançamento.

#### `deleteInstallment(installmentId: string)`
Exclui uma parcela (apenas se não quitada).

## Recursos do Sistema

### ✅ Funcionalidades Principais

1. **Geração Automática de Parcelas**
   - Divisão uniforme do valor total
   - Ajuste automático de centavos na última parcela
   - Vencimentos mensais automáticos
   - Suporte a qualquer número de parcelas

2. **Controle Individual de Parcelas**
   - Quitação independente de cada parcela
   - Registro de forma de pagamento por parcela
   - Registro de conta bancária por parcela
   - Valores de quitação flexíveis

3. **Sincronização com Lançamento Principal**
   - Quitação automática do lançamento quando todas parcelas quitadas
   - Atualização de status em tempo real
   - Consistência garantida por triggers

4. **Resumo e Analytics**
   - Total de parcelas
   - Parcelas quitadas vs pendentes
   - Valores quitados vs pendentes
   - Próximo vencimento

5. **Validações e Segurança**
   - Não permite excluir parcelas quitadas
   - Valida consistência de dados de quitação
   - RLS para isolamento entre organizações
   - Constraints para integridade

## Casos de Uso

### 1. Venda Parcelada
```typescript
// Criar lançamento a receber
const entryId = await createFinancialEntry({
  type: 'receivable',
  amount: 1000,
  // ... outros campos
});

// Gerar 10 parcelas
await generateInstallments({
  entryId,
  numInstallments: 10,
  firstDueDate: '2025-01-01',
  totalAmount: 1000
});
// Resultado: 10 parcelas de R$ 100,00
```

### 2. Compra Parcelada
```typescript
// Criar lançamento a pagar
const entryId = await createFinancialEntry({
  type: 'payable',
  amount: 5000,
  // ... outros campos
});

// Gerar 5 parcelas
await generateInstallments({
  entryId,
  numInstallments: 5,
  firstDueDate: '2025-02-10',
  totalAmount: 5000
});
// Resultado: 5 parcelas de R$ 1.000,00
```

### 3. Quitação de Parcela
```typescript
// Quitar primeira parcela
await settleInstallment(
  installmentId,
  100.00,
  paymentMethodId,
  bankAccountId
);
```

### 4. Obter Status do Parcelamento
```typescript
const summary = await getInstallmentsSummary(entryId);
console.log(`
  Total: ${summary.total_installments} parcelas
  Quitadas: ${summary.settled_installments}
  Pendentes: ${summary.pending_installments}
  Valor pendente: R$ ${summary.pending_amount}
  Próximo vencimento: ${summary.next_due_date}
`);
```

## Benefícios Implementados

✅ **Gestão Completa de Parcelas**
- Controle individual de cada parcela
- Histórico detalhado de quitações
- Flexibilidade total

✅ **Automação Inteligente**
- Geração automática de parcelas
- Cálculo automático de valores
- Atualização automática de status

✅ **Integridade de Dados**
- Validações em nível de banco
- Sincronização garantida
- Histórico protegido

✅ **Performance Otimizada**
- Índices estratégicos
- Queries eficientes
- Cache adequado

✅ **Experiência do Usuário**
- Feedback em tempo real
- Mensagens claras
- Operações rápidas

## Próximos Passos Recomendados

1. **Interface de Usuário**
   - Componente para visualizar parcelas
   - Formulário de geração de parcelas
   - Botões de quitação

2. **Relatórios**
   - Relatório de parcelas a vencer
   - Relatório de inadimplência
   - Analytics de recebimentos

3. **Notificações**
   - Alertas de vencimento próximo
   - Notificação de parcela vencida
   - Resumo mensal

## Status: ✅ 100% CONCLUÍDO

**Sprint 2.1 implementado com sucesso!**
- ✅ Tabela de parcelas criada
- ✅ 5 funções SQL implementadas
- ✅ 2 triggers configurados
- ✅ RLS policies aplicadas
- ✅ Hook React completo
- ✅ Sistema totalmente funcional
