# Sprint 2.2 - Juros, Multas e Descontos ✅

## Objetivo
Implementar sistema completo de cálculo automático de encargos financeiros (juros, multas e descontos) para pagamentos de parcelas, com configuração personalizável por organização.

## Implementações Realizadas

### 1. Extensão do Banco de Dados

#### Campos Adicionados em `organizations`
Configurações padrão de encargos por organização:

- `default_late_fee_percentage` - Percentual de multa por atraso (padrão: 2%)
- `default_daily_interest_percentage` - Percentual de juros diários (padrão: 0.033%)
- `default_early_discount_percentage` - Percentual de desconto para pagamento antecipado (padrão: 0%)
- `default_early_discount_days` - Dias para aplicar desconto antecipado (padrão: 0)

#### Campos Adicionados em `financial_entry_installments`
Registros de encargos aplicados:

- `late_fee` - Valor da multa aplicada
- `interest_amount` - Valor dos juros aplicados
- `discount_amount` - Valor do desconto aplicado
- `final_amount` - Valor final com encargos/descontos

### 2. Funções SQL Implementadas

#### `calculate_installment_charges()`
Calcula encargos financeiros de uma parcela.

**Parâmetros:**
- `p_installment_id` - ID da parcela
- `p_payment_date` - Data do pagamento (padrão: hoje)

**Retorna:**
- `original_amount` - Valor original da parcela
- `late_fee` - Multa por atraso
- `interest_amount` - Juros por atraso
- `discount_amount` - Desconto por antecipação
- `final_amount` - Valor final a pagar
- `days_late` - Dias de atraso
- `days_early` - Dias de antecipação

**Lógica de Cálculo:**

**Pagamento Atrasado:**
```
Multa = Valor Original × (% Multa / 100)
Juros = Valor Original × (% Juros Diário / 100) × Dias de Atraso
Valor Final = Valor Original + Multa + Juros
```

**Pagamento Antecipado:**
```
Desconto = Valor Original × (% Desconto / 100)
Valor Final = Valor Original - Desconto
```
*Desconto aplicado apenas se pagar dentro do período configurado*

**Pagamento em Dia:**
```
Valor Final = Valor Original
```

#### `settle_installment_with_charges()`
Quita parcela calculando automaticamente os encargos.

**Parâmetros:**
- `p_installment_id` - ID da parcela
- `p_payment_date` - Data do pagamento
- `p_payment_method_id` - Forma de pagamento (opcional)
- `p_bank_account_id` - Conta bancária (opcional)
- `p_custom_amount` - Valor customizado (opcional, sobrescreve cálculo)

**Funcionalidades:**
1. Calcula encargos automaticamente
2. Permite valor customizado (útil para negociações)
3. Registra todos os encargos aplicados
4. Atualiza status do lançamento principal
5. Retorna detalhamento completo

**Retorna:**
- `success` - Se operação foi bem sucedida
- `original_amount` - Valor original
- `late_fee` - Multa aplicada
- `interest_amount` - Juros aplicados
- `discount_amount` - Desconto aplicado
- `final_amount` - Valor final calculado
- `message` - Mensagem de resultado

#### `simulate_installment_payment()`
Simula pagamento sem salvar (preview).

**Parâmetros:**
- `p_installment_id` - ID da parcela
- `p_payment_date` - Data simulada do pagamento

**Retorna:**
- Todos os dados da parcela
- Encargos calculados
- Totalizações
- Informações de atraso/antecipação

**Uso:** Permite ao usuário ver quanto pagará antes de confirmar.

#### `get_overdue_installments_with_charges()`
Lista parcelas vencidas com encargos calculados.

**Parâmetros:**
- `p_org_id` - ID da organização
- `p_reference_date` - Data de referência (padrão: hoje)

**Retorna:**
- Lista de parcelas vencidas
- Encargos calculados para cada uma
- Dias de atraso
- Dados da pessoa (cliente/fornecedor)
- Ordenado por data de vencimento

**Uso:** Dashboard de inadimplência, cobranças.

#### `update_organization_financial_config()`
Atualiza configurações de encargos da organização.

**Parâmetros:**
- `p_org_id` - ID da organização
- `p_late_fee_percentage` - % de multa (opcional)
- `p_daily_interest_percentage` - % de juros diário (opcional)
- `p_early_discount_percentage` - % de desconto (opcional)
- `p_early_discount_days` - Dias para desconto (opcional)

**Funcionalidades:**
- Atualiza apenas campos informados
- Mantém valores anteriores para campos não informados
- Permite configuração personalizada por organização

### 3. Índices de Performance

#### `idx_installments_overdue`
Índice parcial para parcelas não quitadas ordenadas por vencimento.
- Otimiza consultas de parcelas vencidas
- Filtrado apenas para `is_settled = false`

#### `idx_installments_settlement_date`
Índice para consultas por data de quitação.
- Otimiza relatórios por período
- Filtrado apenas para `is_settled = true`

### 4. Hook React: `useFinancialCharges`

Novo hook para gerenciamento de encargos no frontend.

**Estado:**
- `loading` - Status de carregamento

**Funções:**

#### `calculateCharges()`
Calcula encargos de uma parcela.
```typescript
calculateCharges(
  installmentId: string,
  paymentDate?: string
): Promise<InstallmentCharges | null>
```

#### `settleWithCharges()`
Quita parcela com cálculo automático de encargos.
```typescript
settleWithCharges(
  installmentId: string,
  paymentDate?: string,
  paymentMethodId?: string,
  bankAccountId?: string,
  customAmount?: number
): Promise<SettleWithChargesResult | null>
```

#### `simulatePayment()`
Simula pagamento para preview.
```typescript
simulatePayment(
  installmentId: string,
  paymentDate?: string
): Promise<PaymentSimulation | null>
```

#### `getOverdueInstallments()`
Lista parcelas vencidas com encargos.
```typescript
getOverdueInstallments(
  referenceDate?: string
): Promise<OverdueInstallment[]>
```

#### `updateFinancialConfig()`
Atualiza configurações de encargos.
```typescript
updateFinancialConfig(
  config: Partial<FinancialConfig>
): Promise<boolean>
```

#### `getFinancialConfig()`
Busca configurações atuais.
```typescript
getFinancialConfig(): Promise<FinancialConfig | null>
```

## Recursos do Sistema

### ✅ Funcionalidades Principais

1. **Cálculo Automático de Multas**
   - Percentual configurável por organização
   - Aplicado automaticamente em pagamentos atrasados
   - Padrão: 2% sobre o valor original

2. **Cálculo Automático de Juros**
   - Juros diários proporcionais aos dias de atraso
   - Percentual configurável por organização
   - Padrão: 0.033% ao dia (≈ 1% ao mês)
   - Fórmula: Juros = Valor × % Diário × Dias

3. **Desconto para Pagamento Antecipado**
   - Incentiva pagamentos antecipados
   - Configurável: % desconto e período (dias)
   - Aplicado apenas dentro do período configurado
   - Padrão: desabilitado (0%)

4. **Simulação de Pagamento**
   - Preview antes de confirmar quitação
   - Mostra todos os encargos que serão aplicados
   - Útil para negociações e transparência

5. **Gestão de Inadimplência**
   - Lista automática de parcelas vencidas
   - Cálculo de encargos em tempo real
   - Ordenação por prioridade (mais antiga primeiro)

6. **Configuração Flexível**
   - Configurações por organização
   - Atualização em tempo real
   - Valores padrão sensatos

7. **Histórico Completo**
   - Registra todos os encargos aplicados
   - Auditoria de valores
   - Transparência total

## Casos de Uso

### 1. Configurar Encargos da Organização
```typescript
const { updateFinancialConfig } = useFinancialCharges();

await updateFinancialConfig({
  late_fee_percentage: 2.0,        // 2% de multa
  daily_interest_percentage: 0.033, // 0.033% ao dia (1% mês)
  early_discount_percentage: 5.0,   // 5% de desconto
  early_discount_days: 5            // Se pagar até 5 dias antes
});
```

### 2. Simular Pagamento
```typescript
const { simulatePayment } = useFinancialCharges();

// Cliente quer saber quanto vai pagar hoje
const simulation = await simulatePayment(installmentId);

console.log(`
  Valor Original: R$ ${simulation.original_amount}
  Multa: R$ ${simulation.late_fee}
  Juros (${simulation.days_late} dias): R$ ${simulation.interest_amount}
  Desconto: R$ ${simulation.discount_amount}
  ---
  Valor Final: R$ ${simulation.final_amount}
`);
```

### 3. Quitar com Encargos Automáticos
```typescript
const { settleWithCharges } = useFinancialCharges();

// Quita parcela calculando tudo automaticamente
const result = await settleWithCharges(
  installmentId,
  '2025-01-15',  // Data do pagamento
  paymentMethodId,
  bankAccountId
);

if (result?.success) {
  console.log(`Quitado! Total: R$ ${result.final_amount}`);
}
```

### 4. Negociação - Valor Customizado
```typescript
// Cliente negociou desconto especial
await settleWithCharges(
  installmentId,
  '2025-01-15',
  paymentMethodId,
  bankAccountId,
  850.00  // Valor negociado (ao invés do calculado)
);
```

### 5. Dashboard de Inadimplência
```typescript
const { getOverdueInstallments } = useFinancialCharges();

const overdue = await getOverdueInstallments();

overdue.forEach(item => {
  console.log(`
    Cliente: ${item.person_name}
    Parcela: ${item.installment_number}/${item.total_installments}
    Vencimento: ${item.due_date}
    Atraso: ${item.days_overdue} dias
    Valor Original: R$ ${item.original_amount}
    Encargos: R$ ${item.late_fee + item.interest_amount}
    Total: R$ ${item.final_amount}
  `);
});
```

## Exemplos de Cálculo

### Exemplo 1: Pagamento Atrasado
```
Valor Original: R$ 1.000,00
Vencimento: 01/01/2025
Pagamento: 15/01/2025 (14 dias de atraso)

Configuração:
- Multa: 2%
- Juros: 0.033% ao dia

Cálculo:
- Multa = 1.000 × 2% = R$ 20,00
- Juros = 1.000 × 0.033% × 14 = R$ 4,62
- Total = 1.000 + 20 + 4,62 = R$ 1.024,62
```

### Exemplo 2: Pagamento Antecipado
```
Valor Original: R$ 1.000,00
Vencimento: 01/02/2025
Pagamento: 25/01/2025 (7 dias antes)

Configuração:
- Desconto: 5%
- Período: até 10 dias antes

Cálculo:
- Desconto = 1.000 × 5% = R$ 50,00
- Total = 1.000 - 50 = R$ 950,00
```

### Exemplo 3: Pagamento em Dia
```
Valor Original: R$ 1.000,00
Vencimento: 01/01/2025
Pagamento: 01/01/2025

Cálculo:
- Sem multa
- Sem juros
- Sem desconto
- Total = R$ 1.000,00
```

## Benefícios Implementados

✅ **Automação Total**
- Cálculos automáticos e precisos
- Sem erros humanos
- Economia de tempo

✅ **Transparência**
- Cliente vê detalhamento completo
- Simulação antes de pagar
- Histórico auditável

✅ **Flexibilidade**
- Configurações por organização
- Valores customizáveis
- Negociações permitidas

✅ **Gestão de Inadimplência**
- Lista automática de vencidos
- Encargos em tempo real
- Priorização inteligente

✅ **Incentivo a Pagamentos**
- Desconto para antecipação
- Transparência gera confiança
- Reduz inadimplência

✅ **Performance Otimizada**
- Índices estratégicos
- Queries eficientes
- Cálculos rápidos

## Integração com Sprint 2.1

Este sprint complementa perfeitamente o Sprint 2.1:

**Sprint 2.1:** Cria e gerencia parcelas
**Sprint 2.2:** Calcula encargos das parcelas

**Juntos formam:**
- Sistema completo de parcelamento
- Gestão financeira profissional
- Controle total de recebíveis/pagáveis

## Próximos Passos Recomendados

1. **Interface de Configuração**
   - Tela de configuração de encargos
   - Ajustes por organização
   - Preview de impacto

2. **Componente de Simulação**
   - Modal de simulação de pagamento
   - Exibição detalhada de encargos
   - Calculadora interativa

3. **Dashboard de Inadimplência**
   - Lista de parcelas vencidas
   - Totalizações de encargos
   - Ações de cobrança

4. **Relatórios**
   - Receita de juros e multas
   - Análise de inadimplência
   - Efetividade de descontos

5. **Notificações**
   - Alerta de vencimento próximo
   - Lembrete de desconto disponível
   - Cobrança automática

## Status: ✅ 100% CONCLUÍDO

**Sprint 2.2 implementado com sucesso!**
- ✅ 4 campos adicionados em organizations
- ✅ 4 campos adicionados em installments
- ✅ 5 funções SQL implementadas
- ✅ 2 índices de performance criados
- ✅ Hook React completo
- ✅ Sistema totalmente funcional
- ✅ Integrado com Sprint 2.1
