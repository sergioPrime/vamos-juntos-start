# 🛠️ Guia de Desenvolvimento - Prime ERP

**Versão:** 1.0  
**Atualizado em:** 22 de Janeiro de 2025

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Setup do Ambiente](#setup-do-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Convenções de Código](#convenções-de-código)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Testes](#testes)
- [Debugging](#debugging)
- [Git Workflow](#git-workflow)

---

## 🎯 Visão Geral

Prime ERP é uma solução ERP completa desenvolvida com:
- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **UI:** Tailwind CSS + shadcn/ui + Radix UI
- **State:** React Query + Context API
- **Testes:** Vitest + React Testing Library

---

## 📦 Pré-requisitos

### Software Necessário
```bash
Node.js >= 18.x
npm >= 9.x
Git >= 2.x
```

### Contas Necessárias
- Supabase (projeto já configurado)
- GitHub (para versionamento)

### Ferramentas Recomendadas
- **IDE:** VS Code com extensões:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
- **Database:** Supabase Studio (incluído)
- **API Testing:** Thunder Client ou Postman

---

## 🚀 Setup do Ambiente

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd prime-erp
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

O projeto já está conectado ao Supabase. As credenciais estão em:
- `src/integrations/supabase/client.ts`

**Não é necessário criar arquivo `.env`** - o projeto usa as credenciais diretamente no código.

### 4. Inicie o Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse: `http://localhost:8080`

---

## 📁 Estrutura do Projeto

```
prime-erp/
├── src/
│   ├── assets/              # Imagens, fontes, etc
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes base (shadcn)
│   │   ├── auth/           # Componentes de autenticação
│   │   ├── finance/        # Componentes financeiros
│   │   ├── inventory/      # Componentes de estoque
│   │   ├── permissions/    # Componentes de permissões
│   │   └── ...
│   ├── hooks/              # Custom React Hooks
│   ├── pages/              # Páginas da aplicação
│   ├── lib/                # Utilitários e helpers
│   ├── constants/          # Constantes e configurações
│   ├── contexts/           # Context Providers
│   ├── integrations/       # Integrações externas
│   │   └── supabase/      # Cliente e tipos Supabase
│   ├── schemas/            # Schemas Zod
│   ├── test/               # Setup e utils de teste
│   ├── utils/              # Funções utilitárias
│   ├── App.tsx             # Componente raiz
│   ├── main.tsx            # Entry point
│   └── index.css           # Estilos globais
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migrações do banco
├── public/                 # Assets estáticos
├── docs/                   # Documentação adicional
└── tests/                  # Testes E2E (futuro)
```

### Organização de Componentes

```
components/
├── ui/                    # Componentes base reutilizáveis
├── [feature]/            # Componentes por feature
│   ├── [Feature]Form.tsx
│   ├── [Feature]List.tsx
│   ├── [Feature]Dialog.tsx
│   └── __tests__/
└── layout/               # Componentes de layout
```

---

## 📝 Convenções de Código

### TypeScript

#### Interfaces e Types
```typescript
// Use PascalCase para interfaces e types
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'viewer';
```

#### Componentes
```typescript
// Use named exports para componentes
export function MyComponent({ prop }: MyComponentProps) {
  return <div>{prop}</div>;
}

// Use interfaces para props
interface MyComponentProps {
  prop: string;
  optional?: number;
}
```

### Nomenclatura

- **Arquivos:**
  - Componentes: `PascalCase.tsx` (ex: `UserForm.tsx`)
  - Hooks: `camelCase.ts` (ex: `useAuth.ts`)
  - Utils: `camelCase.ts` (ex: `formatCurrency.ts`)
  - Tests: `*.test.tsx` ou `*.test.ts`

- **Variáveis:**
  - `camelCase` para variáveis e funções
  - `UPPER_SNAKE_CASE` para constantes
  - `PascalCase` para componentes

- **CSS Classes:**
  - Use Tailwind utilities sempre que possível
  - Para custom CSS, use `kebab-case`

### Design System

**CRÍTICO:** Use sempre as variáveis CSS do design system:

```tsx
// ❌ ERRADO - cores diretas
<Button className="bg-blue-500 text-white">

// ✅ CORRETO - variáveis do design system
<Button className="bg-primary text-primary-foreground">
```

Variáveis disponíveis:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`

### Padrões de Hooks

```typescript
// Custom hooks sempre começam com 'use'
export function useFeature() {
  const [state, setState] = useState();
  
  // Memoize callbacks
  const handleAction = useCallback(() => {
    // ...
  }, [dependencies]);
  
  // Memoize valores computados
  const computed = useMemo(() => {
    // ...
  }, [dependencies]);
  
  return { state, handleAction, computed };
}
```

### Tratamento de Erros

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select();
    
  if (error) throw error;
  
  return data;
} catch (error) {
  console.error('Error in operation:', error);
  toast({
    title: 'Erro',
    description: 'Falha ao executar operação',
    variant: 'destructive',
  });
  return null;
}
```

---

## 💻 Desenvolvimento Local

### Rodando o Projeto

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview do build
npm run preview
```

### Trabalhando com Supabase

#### Acessar o Banco de Dados
URL: `https://supabase.com/dashboard/project/wrdyffwjlylgxfbxbztf`

#### Criar Migração
1. Acesse SQL Editor no Supabase
2. Execute sua migração
3. Salve o SQL em `supabase/migrations/`

#### Edge Functions
```bash
# Localização
supabase/functions/[function-name]/index.ts

# Deploy é automático via Lovable
```

### Hot Module Replacement (HMR)

O Vite suporta HMR. Mudanças em:
- Componentes React: ✅ Hot reload
- Hooks: ✅ Hot reload  
- CSS: ✅ Hot reload
- Types Supabase: ❌ Requer restart

### Regenerar Types do Supabase

Types são gerados automaticamente pelo Lovable.
Se precisar regenerar manualmente, não edite `src/integrations/supabase/types.ts`.

---

## 🧪 Testes

### Estrutura de Testes

```
src/
├── hooks/__tests__/
├── utils/__tests__/
├── components/[feature]/__tests__/
└── __tests__/
    ├── integration/
    └── e2e/
```

### Comandos

```bash
# Rodar todos os testes
npm run test

# Testes com coverage
npm run test:coverage

# UI interativa do Vitest
npm run test:ui

# Watch mode
npm run test:watch
```

### Escrevendo Testes

#### Unit Test (Hook)
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should do something', () => {
    const { result } = renderHook(() => useMyHook());
    
    expect(result.current.value).toBe(expectedValue);
  });
});
```

#### Component Test
```typescript
import { renderWithProviders, screen } from '@/test/utils/renderWithProviders';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

#### Integration Test
```typescript
import { renderHook, act } from '@testing-library/react';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

describe('Feature Flow', () => {
  it('should complete flow', async () => {
    const { result } = renderHook(() => useFeature(), {
      wrapper: AllTheProviders,
    });
    
    await act(async () => {
      await result.current.doSomething();
    });
    
    expect(result.current.state).toBe('completed');
  });
});
```

### Mocking Supabase

```typescript
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

// Mock de query
vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockResolvedValue({
    data: mockData,
    error: null,
  }),
} as any);
```

---

## 🐛 Debugging

### React DevTools
Instale a extensão React DevTools no Chrome/Firefox

### Supabase Logs
```typescript
// Ativar logs do Supabase
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

### Console Logs
```typescript
// Use console.group para organizar logs
console.group('Feature Action');
console.log('Input:', input);
console.log('Result:', result);
console.groupEnd();
```

### Network Debugging
- Use DevTools Network tab
- Filtrar por `supabase.co` para ver chamadas API
- Verificar headers de autenticação

### Debugging de Testes
```bash
# Rodar teste específico
npm run test -- MyComponent.test

# Rodar com logs
npm run test -- --reporter=verbose
```

---

## 🔄 Git Workflow

### Branches

```
main              # Produção
├── develop       # Desenvolvimento
    ├── feature/  # Novas features
    ├── fix/      # Correções
    └── refactor/ # Refatorações
```

### Commits

Siga o padrão Conventional Commits:

```
feat: adiciona página de relatórios
fix: corrige cálculo de parcelas
refactor: reorganiza componentes financeiros
test: adiciona testes para useAuth
docs: atualiza documentação de API
style: ajusta espaçamentos no dashboard
perf: otimiza queries do Supabase
chore: atualiza dependências
```

### Pull Requests

1. Crie branch a partir de `develop`
2. Faça suas alterações
3. Execute testes: `npm run test`
4. Commit com mensagem descritiva
5. Push e abra PR para `develop`
6. Aguarde code review
7. Após aprovação, merge

### Code Review Checklist

- [ ] Código segue convenções do projeto
- [ ] Testes passando (coverage > 80%)
- [ ] Sem console.logs desnecessários
- [ ] TypeScript sem erros
- [ ] Responsivo mobile
- [ ] Acessível (a11y)
- [ ] Sem hardcoded values
- [ ] Documentação atualizada

---

## 🔐 Segurança

### Boas Práticas

1. **Nunca commite credenciais**
   - Tokens, senhas, API keys devem estar em secrets

2. **Validação de Input**
   ```typescript
   import { z } from 'zod';
   
   const schema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
   });
   ```

3. **Sanitização**
   - Use Zod para validação
   - Nunca confie em input do usuário

4. **RLS (Row Level Security)**
   - Sempre habilite RLS em tabelas
   - Crie políticas adequadas para cada operação

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase](https://supabase.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)

### Arquivos de Referência
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema
- [API.md](./API.md) - Documentação de APIs
- [TESTING.md](./TESTING.md) - Guia de testes
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy e produção

---

## ❓ Troubleshooting

### Erro: "Module not found"
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Erro: "TypeScript errors"
```bash
# Verifique types do Supabase
# Types são gerados automaticamente
```

### Erro: "Build failed"
```bash
# Verifique console para detalhes
npm run build

# Teste localmente
npm run preview
```

### Erro: "Tests failing"
```bash
# Rode com mais detalhes
npm run test -- --reporter=verbose

# Limpe cache de teste
npm run test -- --clearCache
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Busque em issues existentes
3. Abra uma nova issue com detalhes

---

**Mantido por:** Equipe de Desenvolvimento Prime ERP  
**Última atualização:** 22/01/2025
