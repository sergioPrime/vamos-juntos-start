# 🏗️ Arquitetura do Sistema - Prime ERP

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Padrões de Código](#padrões-de-código)
- [Fluxo de Dados](#fluxo-de-dados)
- [Segurança](#segurança)
- [Performance](#performance)

---

## 🎯 Visão Geral

O Prime ERP é construído com uma arquitetura moderna de **SPA (Single Page Application)** no frontend e **BaaS (Backend as a Service)** com Supabase, seguindo princípios de:

- **Modularização**: Código organizado em módulos independentes
- **Escalabilidade**: Preparado para crescimento
- **Manutenibilidade**: Código limpo e bem documentado
- **Performance**: Otimizações de carregamento e renderização
- **Segurança**: RLS, permissões granulares e auditoria

---

## 🏛️ Arquitetura de Alto Nível

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │          React Application (SPA)                 │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  • Pages (Rotas)                                 │    │
│  │  • Components (UI)                               │    │
│  │  • Hooks (Lógica)                                │    │
│  │  • Contexts (Estado Global)                      │    │
│  └─────────────────────────────────────────────────┘    │
│                        ↕                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Supabase Client SDK                      │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────┐
│              SUPABASE CLOUD (Backend)                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     Auth     │  │   Database   │  │   Storage    │  │
│  │              │  │              │  │              │  │
│  │ • JWT        │  │ • PostgreSQL │  │ • Buckets    │  │
│  │ • RLS        │  │ • RLS        │  │ • Images     │  │
│  │ • Providers  │  │ • Functions  │  │ • Documents  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Edge Funcs   │  │  Realtime    │  │   Webhooks   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Frontend Core
```typescript
{
  "react": "^18.3.1",           // UI Library
  "typescript": "^5.x",         // Type Safety
  "vite": "^5.x",               // Build Tool
  "@tanstack/react-query": "^5.x",  // Data Fetching
  "react-router-dom": "^6.x",   // Routing
}
```

### UI & Styling
```typescript
{
  "tailwindcss": "^3.x",        // Utility-first CSS
  "shadcn/ui": "custom",        // Component Library
  "lucide-react": "^0.x",       // Icons
  "recharts": "^2.x",           // Charts
  "framer-motion": "implicit"   // Animations
}
```

### Forms & Validation
```typescript
{
  "react-hook-form": "^7.x",    // Form Management
  "zod": "^3.x",                // Schema Validation
  "@hookform/resolvers": "^3.x" // RHF + Zod Integration
}
```

### Backend & Data
```typescript
{
  "@supabase/supabase-js": "^2.x",  // Supabase Client
  "date-fns": "^3.x",           // Date Utilities
}
```

### Testing
```typescript
{
  "vitest": "latest",           // Test Runner
  "@testing-library/react": "latest",  // Component Testing
  "@testing-library/jest-dom": "latest",  // DOM Matchers
  "@testing-library/user-event": "latest" // User Interactions
}
```

---

## 📁 Estrutura de Pastas

```
prime-erp/
├── public/                     # Assets estáticos
│   ├── clients/               # Logos de clientes
│   └── lovable-uploads/       # Uploads
│
├── supabase/                   # Configuração Supabase
│   ├── migrations/            # Migrations do banco
│   ├── functions/             # Edge Functions
│   └── config.toml            # Config do Supabase
│
├── src/
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base (shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/             # Autenticação
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── PermissionRoute.tsx
│   │   │   └── AdminRoute.tsx
│   │   │
│   │   ├── permissions/      # Sistema de Permissões
│   │   │   ├── PermissionGate.tsx
│   │   │   ├── ActionButton.tsx
│   │   │   └── ModuleAccessGuard.tsx
│   │   │
│   │   ├── finance/          # Módulo Financeiro
│   │   ├── inventory/        # Módulo Estoque
│   │   ├── pdv/              # PDV
│   │   ├── orders/           # Pedidos
│   │   ├── dashboard/        # Dashboard
│   │   ├── layout/           # Layout components
│   │   └── animations/       # Componentes animados
│   │
│   ├── pages/                # Páginas (Rotas)
│   │   ├── Dashboard.tsx
│   │   ├── Auth.tsx
│   │   ├── finance/          # Páginas financeiras
│   │   ├── inventory/        # Páginas de estoque
│   │   ├── cadastros/        # Cadastros
│   │   ├── settings/         # Configurações
│   │   └── ...
│   │
│   ├── hooks/                # Custom Hooks
│   │   ├── useAuth.tsx       # Autenticação
│   │   ├── useOrganization.tsx  # Organização
│   │   ├── usePermissions.tsx   # Permissões
│   │   ├── useModulePermissions.tsx
│   │   ├── useFinancialData.ts
│   │   └── ...
│   │
│   ├── contexts/             # React Contexts
│   │   ├── AnimationContext.tsx
│   │   └── SidebarConfigContext.tsx
│   │
│   ├── lib/                  # Utilities
│   │   ├── utils.ts          # Helper functions
│   │   └── queryClient.ts    # TanStack Query config
│   │
│   ├── constants/            # Constantes
│   │   └── permissions.ts    # Módulos e permissões
│   │
│   ├── schemas/              # Zod Schemas
│   │   ├── financialEntries.ts
│   │   └── index.ts
│   │
│   ├── utils/                # Utilities específicas
│   │   ├── dateRanges.ts     # Date utilities
│   │   ├── passwordValidation.ts
│   │   └── ...
│   │
│   ├── integrations/         # Integrações
│   │   └── supabase/
│   │       ├── client.ts     # Supabase client
│   │       └── types.ts      # TypeScript types (auto-generated)
│   │
│   ├── test/                 # Configuração de Testes
│   │   ├── setup.ts
│   │   └── utils/
│   │       └── renderWithProviders.tsx
│   │
│   ├── App.tsx               # Componente raiz
│   ├── main.tsx              # Entry point
│   ├── index.css             # Estilos globais
│   └── vite-env.d.ts         # Vite types
│
├── docs/                      # Documentação
│   ├── architecture/
│   ├── guides/
│   └── screenshots/
│
├── .env.example              # Exemplo de variáveis
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts          # Config de testes
├── tailwind.config.ts
├── README.md
├── ARCHITECTURE.md           # Este arquivo
└── CRONOGRAMA_EFICAZ.md      # Roadmap
```

---

## 📐 Padrões de Código

### Component Pattern

#### Page Component
```typescript
// src/pages/Dashboard.tsx
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <h1>Dashboard</h1>
      {/* content */}
    </div>
  );
}
```

#### Reusable Component
```typescript
// src/components/dashboard/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
}

export function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <Card>
      {/* component logic */}
    </Card>
  );
}
```

### Custom Hook Pattern
```typescript
// src/hooks/useFinancialData.ts
export function useFinancialData(filters: Filters) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial', filters],
    queryFn: () => fetchFinancialData(filters),
  });

  return { data, isLoading, error };
}
```

### Context Pattern
```typescript
// src/contexts/ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>(null!);

export function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Permission Pattern
```typescript
// Using PermissionGate
<PermissionGate moduleKey="financeiro" permission="create">
  <Button onClick={createEntry}>Novo Lançamento</Button>
</PermissionGate>

// Using ActionButton
<ActionButton 
  moduleKey="estoque" 
  permission="delete"
  onClick={deleteProduct}
>
  Excluir
</ActionButton>
```

---

## 🔄 Fluxo de Dados

### 1. Autenticação
```
User Login 
  → Supabase Auth 
  → JWT Token 
  → AuthContext 
  → Protected Routes
```

### 2. Data Fetching
```
Component 
  → Custom Hook (useQuery)
  → Supabase Client 
  → RLS Validation 
  → Data Return 
  → Component Render
```

### 3. Mutations
```
User Action 
  → Form Submit 
  → useMutation 
  → Supabase Client 
  → Database Update 
  → Query Invalidation 
  → UI Update
```

### 4. Real-time Updates
```
Database Change 
  → Supabase Realtime 
  → Subscription Hook 
  → State Update 
  → Component Re-render
```

---

## 🔒 Segurança

### Row Level Security (RLS)
```sql
-- Exemplo: Users só veem dados da sua org
CREATE POLICY "Users can only see their org data"
ON financial_entries
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);
```

### Permissões Granulares
```typescript
// Sistema de módulos e permissões
MODULES = {
  FINANCEIRO: 'financeiro',
  ESTOQUE: 'estoque',
  VENDAS: 'vendas',
  // ...
}

// Permissões por módulo
type PermissionType = 'create' | 'read' | 'update' | 'delete';
```

### Auditoria
```sql
-- Todas as ações são registradas
CREATE TABLE transaction_audit (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ⚡ Performance

### Lazy Loading
```typescript
// Todos os componentes de página são lazy loaded
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
```

### Code Splitting
- Bundle inicial: ~400-500KB (gzip)
- Cada rota carrega seu próprio chunk
- Redução de 40-50% no bundle inicial

### Query Optimization
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minuto
      gcTime: 5 * 60 * 1000,     // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Image Optimization
- Lazy loading de imagens
- Formatos modernos (WebP)
- Responsive images

---

## 📊 Diagrama de Componentes

```
App.tsx
├── AuthProvider
│   ├── OrganizationProvider
│   │   ├── SubscriptionProvider
│   │   │   ├── ThemeProvider
│   │   │   │   ├── QueryClientProvider
│   │   │   │   │   ├── BrowserRouter
│   │   │   │   │   │   ├── Routes
│   │   │   │   │   │   │   ├── Public Routes
│   │   │   │   │   │   │   │   ├── / (Landing)
│   │   │   │   │   │   │   │   └── /auth
│   │   │   │   │   │   │   └── Protected Routes
│   │   │   │   │   │   │       ├── AppLayout
│   │   │   │   │   │   │       │   ├── Sidebar
│   │   │   │   │   │   │       │   ├── Header
│   │   │   │   │   │   │       │   └── Page Content
│   │   │   │   │   │   │       └── Pages
```

---

## 🎨 Design System

### Cores (HSL)
```css
:root {
  --primary: 218 91% 60%;
  --secondary: 210 16% 82%;
  --accent: 200 96% 88%;
  --destructive: 0 84% 60%;
  --success: 158 64% 52%;
  /* ... */
}
```

### Espaçamento
```css
/* Sistema de hierarquia visual */
.bg-level-1 { /* Fundo principal */ }
.bg-level-2 { /* Cards */ }
.bg-level-3 { /* Elementos flutuantes */ }
```

### Tipografia
```css
/* Títulos: Poppins Bold */
h1, h2, h3 { font-family: 'Poppins'; }

/* Corpo: Inter */
body { font-family: 'Inter'; }

/* Números: Roboto Mono */
.currency { font-family: 'Roboto Mono'; }
```

---

## 🔗 Integrações

### Supabase
- **Auth**: Autenticação completa
- **Database**: PostgreSQL com RLS
- **Storage**: Arquivos e imagens
- **Realtime**: Subscriptions
- **Edge Functions**: Serverless

### Futuras Integrações
- **Stripe**: Pagamentos
- **SendGrid**: E-mails
- **WhatsApp**: Notificações
- **APIs Fiscais**: NF-e, NFS-e

---

## 📚 Referências

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Shadcn/ui](https://ui.shadcn.com/)

---

**Última atualização:** 2025-01-21  
**Versão:** 1.0.0
