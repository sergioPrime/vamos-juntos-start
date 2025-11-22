# 🧪 Guia de Testes - Prime ERP

**Versão:** 1.0  
**Atualizado em:** 22 de Janeiro de 2025

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Tipos de Testes](#tipos-de-testes)
- [Escrevendo Testes](#escrevendo-testes)
- [Mocking](#mocking)
- [Best Practices](#best-practices)
- [Coverage](#coverage)
- [CI/CD](#cicd)

---

## 🎯 Visão Geral

O Prime ERP utiliza uma estratégia abrangente de testes:

### Stack de Testes
- **Framework:** Vitest (compatível com Jest)
- **React Testing:** React Testing Library
- **Mocking:** Vitest Mock + MSW (futuro)
- **Coverage:** c8 (built-in Vitest)

### Cobertura Atual
```
✅ Coverage: 83%
✅ Tests: 196+
✅ Unit Tests: 85+
✅ Component Tests: 75+
✅ Integration Tests: 24+
✅ E2E Tests: 12+ (planejado)
```

---

## ⚙️ Configuração

### Vitest Config

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
  },
});
```

### Setup de Teste

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));
```

---

## 📚 Tipos de Testes

### 1. Unit Tests

Testam funções e hooks isoladamente.

**Quando usar:**
- Funções utilitárias
- Custom hooks
- Helpers e validators

**Localização:** Junto ao arquivo testado
```
src/hooks/useAuth.ts
src/hooks/__tests__/useAuth.test.tsx
```

**Exemplo:**
```typescript
// src/utils/__tests__/formatCurrency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../formatCurrency';

describe('formatCurrency', () => {
  it('should format number as BRL currency', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });
  
  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
  
  it('should handle negative numbers', () => {
    expect(formatCurrency(-100)).toBe('R$ -100,00');
  });
});
```

### 2. Component Tests

Testam comportamento de componentes React.

**Quando usar:**
- Componentes UI
- Componentes de feature
- Formulários

**Localização:** Junto ao componente
```
src/components/finance/InstallmentsPanel.tsx
src/components/finance/__tests__/InstallmentsPanel.test.tsx
```

**Exemplo:**
```typescript
// src/components/ui/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils/renderWithProviders';
import { Button } from '../button';

describe('Button', () => {
  it('should render children', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button onClick={onClick}>Click</Button>
    );
    
    await user.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  
  it('should be disabled when disabled prop is true', () => {
    renderWithProviders(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 3. Integration Tests

Testam fluxos completos com múltiplos componentes/hooks.

**Quando usar:**
- Fluxos de usuário
- Interação entre múltiplos módulos
- CRUD completo

**Localização:** `src/__tests__/integration/`
```
src/__tests__/integration/financial-entry-flow.test.tsx
```

**Exemplo:**
```typescript
// src/__tests__/integration/financial-entry-flow.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFinancialEntries } from '@/hooks/useFinancialEntries';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

describe('Financial Entry Flow', () => {
  it('should create and list entries', async () => {
    // Mock Supabase
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: {...}, error: null }),
      select: vi.fn().mockResolvedValue({ data: [...], error: null }),
    } as any);
    
    const { result } = renderHook(() => useFinancialEntries(), {
      wrapper: AllTheProviders,
    });
    
    // Create entry
    await act(async () => {
      await result.current.createEntry({
        amount: 1000,
        entry_type: 'receivable',
        // ...
      });
    });
    
    // Load entries
    await act(async () => {
      await result.current.loadEntries();
    });
    
    // Verify
    expect(result.current.entries.length).toBeGreaterThan(0);
  });
});
```

### 4. E2E Tests (Planejado)

Testam a aplicação como um usuário real.

**Quando usar:**
- Fluxos críticos end-to-end
- Smoke tests em produção
- User journeys completos

**Ferramentas:** Playwright ou Cypress (futuro)

---

## ✍️ Escrevendo Testes

### Estrutura AAA Pattern

```typescript
it('should do something', () => {
  // Arrange - Preparar
  const input = 'test';
  const expected = 'TEST';
  
  // Act - Executar
  const result = transform(input);
  
  // Assert - Verificar
  expect(result).toBe(expected);
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

it('should update state on action', () => {
  const { result } = renderHook(() => useMyHook(), {
    wrapper: AllTheProviders, // Necessário para Context Providers
  });
  
  // Ações devem ser envolvidas em act()
  act(() => {
    result.current.doSomething();
  });
  
  expect(result.current.state).toBe('updated');
});
```

### Testing Async Operations

```typescript
it('should fetch data', async () => {
  const { result } = renderHook(() => useData());
  
  // Aguarde operações assíncronas
  await act(async () => {
    await result.current.fetchData();
  });
  
  expect(result.current.data).toBeDefined();
});
```

### Testing Components with User Events

```typescript
import { renderWithProviders, screen } from '@/test/utils/renderWithProviders';

it('should update on user input', async () => {
  const { user } = renderWithProviders(<MyForm />);
  
  const input = screen.getByLabelText('Name');
  await user.type(input, 'John Doe');
  
  expect(input).toHaveValue('John Doe');
});
```

---

## 🎭 Mocking

### Mock de Funções

```typescript
import { vi } from 'vitest';

// Mock simples
const mockFn = vi.fn();
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value');

// Verificações
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mock de Módulos

```typescript
// Mock completo
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));

// Mock parcial
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    formatCurrency: vi.fn(() => 'R$ 0,00'),
  };
});
```

### Mock do Supabase

```typescript
import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

// Mock de query
vi.mocked(supabase.from).mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'Test' }],
      error: null,
    }),
  }),
} as any);

// Mock de insert
vi.mocked(supabase.from).mockReturnValue({
  insert: vi.fn().mockResolvedValue({
    data: { id: '1' },
    error: null,
  }),
} as any);

// Mock de update
vi.mocked(supabase.from).mockReturnValue({
  update: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
  }),
} as any);
```

### Mock de Context

```typescript
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({
    currentOrg: { id: 'org-123', name: 'Test Org' },
    loading: false,
  }),
}));
```

---

## 🎯 Best Practices

### 1. Teste o Comportamento, Não a Implementação

```typescript
// ❌ BAD - Testa implementação
it('should call setState', () => {
  const { result } = renderHook(() => useCounter());
  expect(result.current.setState).toBeDefined();
});

// ✅ GOOD - Testa comportamento
it('should increment counter', () => {
  const { result } = renderHook(() => useCounter());
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

### 2. Use Queries Semânticas

```typescript
// ❌ BAD - Query frágil
screen.getByText('Submit');

// ✅ GOOD - Query semântica
screen.getByRole('button', { name: /submit/i });
```

### 3. Evite Detalhes de Implementação

```typescript
// ❌ BAD - Depende de classes CSS
screen.getByClassName('btn-primary');

// ✅ GOOD - Usa role e texto
screen.getByRole('button', { name: 'Submit' });
```

### 4. Limpe Após Cada Teste

```typescript
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks(); // Limpa mocks
  vi.restoreAllMocks(); // Restaura implementações originais
});
```

### 5. Isole Testes

```typescript
// Cada teste deve ser independente
describe('MyComponent', () => {
  it('test 1', () => {
    // Setup próprio
    // Test próprio
  });
  
  it('test 2', () => {
    // Setup próprio
    // Test próprio
  });
});
```

### 6. Use Descrições Claras

```typescript
// ❌ BAD
it('works', () => {});

// ✅ GOOD
it('should create financial entry when form is submitted with valid data', () => {});
```

### 7. Agrupe Testes Relacionados

```typescript
describe('useAuth', () => {
  describe('login', () => {
    it('should login with valid credentials', () => {});
    it('should show error with invalid credentials', () => {});
  });
  
  describe('logout', () => {
    it('should clear session on logout', () => {});
  });
});
```

---

## 📊 Coverage

### Executar Coverage

```bash
# Coverage completo
npm run test:coverage

# Coverage de arquivo específico
npm run test -- useAuth.test.tsx --coverage
```

### Relatórios

Coverage gera relatórios em:
```
coverage/
├── index.html        # Relatório HTML interativo
├── lcov.info         # Para integração CI/CD
└── coverage-final.json
```

### Metas de Coverage

```
Global: > 80%
├── Hooks: > 75%
├── Components: > 80%
├── Utils: > 85%
└── Critical paths: 100%
```

### Ignorar do Coverage

```typescript
/* istanbul ignore next */
function debugFunction() {
  console.log('Debug only');
}
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hook

```bash
# .husky/pre-commit
npm run test -- --run --bail
```

---

## 🐛 Debugging Testes

### Debug no VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug com console.log

```typescript
it('should debug', () => {
  console.log('Debug info:', result);
  screen.debug(); // Imprime DOM atual
});
```

### Vitest UI

```bash
npm run test:ui
# Abre interface visual em http://localhost:51204
```

---

## 📚 Exemplos Práticos

### Teste Completo de Hook

```typescript
// src/hooks/__tests__/useCounter.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should start with 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });
  
  it('should increment', () => {
    const { result } = renderHook(() => useCounter());
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });
  
  it('should decrement', () => {
    const { result } = renderHook(() => useCounter());
    act(() => result.current.decrement());
    expect(result.current.count).toBe(-1);
  });
  
  it('should reset', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });
    expect(result.current.count).toBe(0);
  });
});
```

### Teste Completo de Componente

```typescript
// src/components/__tests__/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils/renderWithProviders';
import { LoginForm } from '../LoginForm';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('LoginForm', () => {
  it('should render form fields', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });
  
  it('should validate email', async () => {
    const { user } = renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab();
    
    expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
  });
  
  it('should submit form with valid data', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: '123' }, session: {} },
      error: null,
    } as any);
    
    const { user } = renderWithProviders(<LoginForm />);
    
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });
});
```

---

## 📖 Recursos Adicionais

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Mantido por:** Equipe de QA Prime ERP  
**Última atualização:** 22/01/2025
