# 📚 Documentação de API - Prime ERP

**Versão:** 1.0  
**Atualizado em:** 22 de Janeiro de 2025

---

## 📋 Índice

- [Hooks](#hooks)
- [Components](#components)
- [Utils](#utils)
- [Edge Functions](#edge-functions)
- [Types](#types)

---

## 🪝 Hooks

### Authentication

#### `useAuth()`

Gerencia autenticação e sessão do usuário.

```typescript
const {
  user,              // User | null
  session,           // Session | null
  isAuthenticated,   // boolean
  loading,           // boolean
  signIn,            // (email, password) => Promise<void>
  signUp,            // (email, password, metadata) => Promise<void>
  signOut,           // () => Promise<void>
  checkPermission,   // (module, action) => boolean
} = useAuth();
```

**Exemplo:**
```typescript
const { signIn, isAuthenticated } = useAuth();

const handleLogin = async () => {
  await signIn('user@example.com', 'password');
};
```

---

#### `useOrganization()`

Gerencia organização atual do usuário.

```typescript
const {
  currentOrg,           // Organization | null
  userOrgs,             // UserOrganization[]
  loading,              // boolean
  refreshOrganizations, // () => Promise<void>
} = useOrganization();
```

---

### Permissions

#### `usePermissionGuard()`

Verifica permissões do usuário em módulos.

```typescript
const {
  hasPermission,       // (moduleKey, permission) => boolean
  hasAllPermissions,   // (checks[]) => boolean
  hasAnyPermission,    // (checks[]) => boolean
  hasModuleAccess,     // (moduleKey) => boolean
  getModulePermissions,// (moduleKey) => PermissionSet
  canPerformAction,    // (moduleKey, action) => boolean
  loading,             // boolean
  permissions,         // ModulePermission[]
} = usePermissionGuard();
```

**Exemplo:**
```typescript
const { hasPermission } = usePermissionGuard();

if (hasPermission('financeiro', 'create')) {
  // Usuário pode criar lançamentos financeiros
}
```

---

#### `useAccessRequests()`

Gerencia solicitações de acesso a módulos.

```typescript
const {
  requests,       // AccessRequest[]
  loading,        // boolean
  createRequest,  // (data) => Promise<void>
  approveRequest, // (id, notes?) => Promise<void>
  rejectRequest,  // (id, notes) => Promise<void>
  refetch,        // () => Promise<void>
} = useAccessRequests();
```

---

### Financial

#### `useFinancialEntries()`

CRUD de lançamentos financeiros.

```typescript
const {
  entries,      // FinancialEntry[]
  loading,      // boolean
  loadEntries,  // () => Promise<void>
  createEntry,  // (data) => Promise<boolean>
  updateEntry,  // (id, data) => Promise<boolean>
  deleteEntry,  // (id) => Promise<boolean>
  settleEntry,  // (id, data) => Promise<boolean>
} = useFinancialEntries();
```

---

#### `useInstallments()`

Gerencia parcelas de lançamentos.

```typescript
const {
  installments,        // Installment[]
  loading,             // boolean
  loadInstallments,    // (entryId) => Promise<void>
  generateInstallments,// (params) => Promise<boolean>
  settleInstallment,   // (id, amount, methodId?, accountId?) => Promise<boolean>
  unsettleInstallment, // (id) => Promise<boolean>
} = useInstallments();
```

**Exemplo:**
```typescript
const { generateInstallments } = useInstallments();

await generateInstallments({
  entryId: 'entry-123',
  numInstallments: 3,
  firstDueDate: '2025-02-01',
  totalAmount: 900,
});
```

---

#### `useFinancialMetrics()`

Calcula métricas financeiras.

```typescript
const {
  metrics,  // FinancialMetrics | null
  loading,  // boolean
} = useFinancialMetrics(startDate, endDate);

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  receivables: {
    total: number;
    settled: number;
    pending: number;
  };
  payables: {
    total: number;
    settled: number;
    pending: number;
  };
}
```

---

### Inventory

#### `useStockValidation()`

Valida disponibilidade de estoque.

```typescript
const {
  validateSingleProduct, // (productId, qty, warehouseId?) => Promise<ValidationResult>
  validateOrderStock,    // (items[]) => Promise<ValidationResult>
  validateStockExit,     // (productId, qty, warehouseId?) => Promise<ValidationResult>
  checkLowStock,         // () => Promise<Product[]>
  loading,               // boolean
} = useStockValidation();
```

**Exemplo:**
```typescript
const { validateSingleProduct } = useStockValidation();

const result = await validateSingleProduct('prod-123', 10);
if (!result.isValid) {
  console.log('Estoque insuficiente:', result.message);
}
```

---

#### `useLotManagement()`

Gerencia lotes de produtos.

```typescript
const {
  lots,       // Lot[]
  loading,    // boolean
  loadLots,   // (productId?) => Promise<void>
  createLot,  // (data) => Promise<boolean>
  updateLot,  // (id, data) => Promise<boolean>
  deleteLot,  // (id) => Promise<boolean>
} = useLotManagement();
```

---

### Business

#### `useBusinessAlerts()`

Alertas de negócio em tempo real.

```typescript
const {
  alerts,       // BusinessAlert[]
  loading,      // boolean
  refresh,      // () => Promise<void>
  dismissAlert, // (id) => void
} = useBusinessAlerts();

interface BusinessAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action_label?: string;
  action_route?: string;
  amount?: number;
  count?: number;
  created_at: string;
  resolved: boolean;
}
```

---

## 🧩 Components

### UI Components

Todos os componentes base estão em `src/components/ui/` e seguem a API do shadcn/ui.

#### Button
```typescript
<Button variant="default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
        size="default" | "sm" | "lg" | "icon">
  Click me
</Button>
```

#### Dialog
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descrição</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={handleClose}>Fechar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Card
```typescript
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Footer */}
  </CardFooter>
</Card>
```

---

### Permission Components

#### PermissionGate
```typescript
<PermissionGate 
  moduleKey="financeiro" 
  permission="read"
  fallback={<div>Sem permissão</div>}
>
  <ProtectedContent />
</PermissionGate>
```

#### ActionButton
```typescript
<ActionButton
  moduleKey="financeiro"
  action="delete"
  onClick={handleDelete}
  variant="destructive"
>
  Deletar
</ActionButton>
```

---

### Financial Components

#### GenerateInstallmentsDialog
```typescript
<GenerateInstallmentsDialog
  entryId="entry-123"
  totalAmount={1000}
  open={open}
  onOpenChange={setOpen}
  onSuccess={() => console.log('Success')}
/>
```

#### InstallmentsPanel
```typescript
<InstallmentsPanel entryId="entry-123" />
```

#### SettleInstallmentDialog
```typescript
<SettleInstallmentDialog
  installmentId="inst-123"
  open={open}
  onOpenChange={setOpen}
  onSuccess={() => console.log('Settled')}
/>
```

---

## 🛠️ Utils

### Currency
```typescript
import { formatCurrency } from '@/lib/utils';

formatCurrency(1234.56); // "R$ 1.234,56"
```

### Date
```typescript
import { formatDate } from '@/lib/utils';
import { getDateRange } from '@/utils/dateRanges';

formatDate('2025-01-22'); // "22/01/2025"

getDateRange('thisMonth'); // { start, end }
```

### Validation
```typescript
import { validatePassword } from '@/utils/passwordValidation';

const result = validatePassword('myPassword123');
// { isValid: boolean, errors: string[] }
```

### Export
```typescript
import { exportToPDF, exportToExcel, exportToCSV } from '@/utils/financialExport';

// PDF
await exportToPDF(data, 'filename');

// Excel
await exportToExcel(data, 'filename');

// CSV
await exportToCSV(data, 'filename');
```

---

## ⚡ Edge Functions

### AI Assistant
```
POST /functions/v1/ai-assistant
```

**Request:**
```json
{
  "prompt": "Analise as vendas do mês",
  "context": { "userId": "user-123" }
}
```

**Response:**
```json
{
  "response": "Análise das vendas...",
  "metadata": {}
}
```

---

### Check Subscription
```
POST /functions/v1/check-subscription
```

**Request:**
```json
{
  "userId": "user-123",
  "organizationId": "org-123"
}
```

**Response:**
```json
{
  "isActive": true,
  "plan": "premium",
  "expiresAt": "2025-12-31"
}
```

---

### Create User
```
POST /functions/v1/create-user
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "metadata": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Response:**
```json
{
  "userId": "user-123",
  "email": "user@example.com"
}
```

---

## 📘 Types

### Core Types

```typescript
// User
interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

// Organization
interface Organization {
  id: string;
  name: string;
  slug: string;
}

// Permission
type PermissionType = 'create' | 'read' | 'update' | 'delete';

type ModuleKey = 
  | 'dashboard'
  | 'financeiro'
  | 'vendas'
  | 'compras'
  | 'estoque'
  | 'cadastros'
  | 'fiscal'
  | 'producao'
  | 'relatorios'
  | 'configuracoes';
```

### Financial Types

```typescript
interface FinancialEntry {
  id: string;
  entry_type: 'receivable' | 'payable';
  amount: number;
  due_date: string;
  is_settled: boolean;
  settled_at?: string;
  person_id?: string;
  description?: string;
  // ... outros campos
}

interface Installment {
  id: string;
  entry_id: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  is_settled: boolean;
  settled_at?: string;
  // ... outros campos
}
```

### Inventory Types

```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  available_stock: number;
  minimum_stock: number;
  // ... outros campos
}

interface Lot {
  id: string;
  lot_number: string;
  product_id: string;
  quantity: number;
  manufacturing_date?: string;
  expiration_date?: string;
  status: 'active' | 'expired' | 'recalled';
}
```

---

## 🔍 Query Patterns

### React Query

```typescript
// Query básica
const { data, isLoading, error } = useQuery({
  queryKey: ['key'],
  queryFn: fetchData,
});

// Mutation
const mutation = useMutation({
  mutationFn: createData,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
  },
});

// Optimistic Update
const mutation = useMutation({
  mutationFn: updateData,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['key'] });
    const previous = queryClient.getQueryData(['key']);
    queryClient.setQueryData(['key'], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['key'], context.previous);
  },
});
```

---

## 📚 Exemplos Completos

### Criar Lançamento com Parcelas

```typescript
import { useFinancialEntries } from '@/hooks/useFinancialEntries';
import { useInstallments } from '@/hooks/useInstallments';

function CreateEntryWithInstallments() {
  const { createEntry } = useFinancialEntries();
  const { generateInstallments } = useInstallments();
  
  const handleCreate = async () => {
    // 1. Criar lançamento
    const entryId = await createEntry({
      entry_type: 'receivable',
      amount: 900,
      due_date: '2025-02-01',
      person_type: 'customer',
      person_id: 'customer-123',
      description: 'Venda de produtos',
    });
    
    if (!entryId) return;
    
    // 2. Gerar parcelas
    await generateInstallments({
      entryId,
      numInstallments: 3,
      firstDueDate: '2025-02-01',
      totalAmount: 900,
    });
    
    console.log('Lançamento criado com 3 parcelas!');
  };
  
  return <Button onClick={handleCreate}>Criar</Button>;
}
```

---

**Mantido por:** Equipe de Desenvolvimento Prime ERP  
**Última atualização:** 22/01/2025
