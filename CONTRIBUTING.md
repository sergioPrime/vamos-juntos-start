# Guia de Contribuição

Obrigado por considerar contribuir com o PrimeGestor! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Sumário

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Melhorias](#sugerindo-melhorias)

## 📜 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e acolhedor para todos.

## 🤝 Como Contribuir

Existem várias formas de contribuir com o PrimeGestor:

### 1. Reportar Bugs
- Use os templates de issue do GitHub
- Descreva o problema detalhadamente
- Inclua passos para reproduzir
- Adicione screenshots quando relevante

### 2. Sugerir Melhorias
- Abra uma issue descrevendo a melhoria
- Explique o valor que ela traz
- Discuta possíveis implementações

### 3. Contribuir com Código
- Fork o repositório
- Crie uma branch para sua feature
- Implemente suas mudanças
- Escreva testes
- Envie um Pull Request

### 4. Melhorar Documentação
- Corrija erros de digitação
- Adicione exemplos
- Melhore explicações
- Traduza documentação

## 🛠️ Configuração do Ambiente

### Pré-requisitos

```bash
# Node.js 18+ e npm/yarn/pnpm
node --version  # v18.0.0+
npm --version   # 9.0.0+
```

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/primegestor.git
cd primegestor

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Execute os testes
npm test
```

### Configuração do Supabase Local (Opcional)

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicie o Supabase localmente
supabase start

# Aplique as migrations
supabase db reset
```

## 📝 Padrões de Código

### TypeScript

- Use TypeScript para todo código novo
- Evite `any`, prefira tipos específicos
- Use interfaces para objetos complexos
- Documente funções públicas com JSDoc

```typescript
/**
 * Calcula o total de uma venda incluindo impostos
 * @param amount - Valor base da venda
 * @param taxRate - Taxa de imposto (0-1)
 * @returns Valor total incluindo impostos
 */
export function calculateTotal(amount: number, taxRate: number): number {
  return amount * (1 + taxRate);
}
```

### React Components

- Use componentes funcionais com hooks
- Prefira composição sobre herança
- Mantenha componentes pequenos e focados
- Use React.memo para componentes pesados

```typescript
interface ProductCardProps {
  product: Product;
  onSelect: (id: string) => void;
}

export const ProductCard = memo(({ product, onSelect }: ProductCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{formatCurrency(product.price)}</p>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';
```

### Hooks Customizados

- Prefixe com `use`
- Retorne objetos nomeados
- Documente dependências
- Implemente testes

```typescript
export function useProduct(productId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
  });

  return {
    product: data,
    loading: isLoading,
    error,
  };
}
```

### Estilização

- Use Tailwind CSS
- Siga o design system (index.css)
- Use tokens semânticos (bg-background, text-foreground)
- Evite estilos inline quando possível

```tsx
// ✅ Bom
<div className="bg-background text-foreground p-4 rounded-lg">
  <h2 className="text-2xl font-bold">Título</h2>
</div>

// ❌ Evite
<div style={{ backgroundColor: '#fff', padding: '16px' }}>
  <h2 style={{ fontSize: '24px' }}>Título</h2>
</div>
```

### Testes

- Teste componentes críticos
- Use React Testing Library
- Siga padrão AAA (Arrange, Act, Assert)
- Mock dependências externas

```typescript
describe('ProductCard', () => {
  it('should display product name and price', () => {
    // Arrange
    const product = { id: '1', name: 'Product 1', price: 100 };
    const onSelect = vi.fn();

    // Act
    render(<ProductCard product={product} onSelect={onSelect} />);

    // Assert
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
  });
});
```

## 🔄 Processo de Pull Request

### 1. Antes de Começar

- Verifique se já existe uma issue relacionada
- Se não houver, crie uma issue para discussão
- Aguarde feedback antes de grandes mudanças

### 2. Criando uma Branch

```bash
# Feature
git checkout -b feature/nome-da-feature

# Bugfix
git checkout -b fix/nome-do-bug

# Documentação
git checkout -b docs/nome-da-melhoria
```

### 3. Fazendo Commits

Use commits semânticos:

```bash
# Formato
<tipo>(<escopo>): <descrição>

# Exemplos
feat(finance): adiciona filtro de data para lançamentos
fix(inventory): corrige cálculo de estoque mínimo
docs(readme): atualiza instruções de instalação
test(hooks): adiciona testes para useAuth
refactor(components): extrai lógica de validação
style(ui): ajusta espaçamento dos cards
chore(deps): atualiza dependências
```

Tipos válidos:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `test`: Testes
- `refactor`: Refatoração
- `style`: Estilização
- `chore`: Tarefas gerais
- `perf`: Performance

### 4. Antes de Enviar o PR

```bash
# Execute os testes
npm test

# Execute o linter
npm run lint

# Execute o type checking
npm run type-check

# Execute o build
npm run build
```

### 5. Criando o Pull Request

- Use o template fornecido
- Descreva as mudanças claramente
- Referencie issues relacionadas
- Adicione screenshots se relevante
- Marque como draft se não estiver pronto

### 6. Revisão de Código

- Responda aos comentários
- Faça as alterações solicitadas
- Peça esclarecimentos se necessário
- Seja receptivo ao feedback

### 7. Após a Aprovação

- Aguarde o merge por um mantenedor
- Delete sua branch após o merge
- Atualize sua branch local

```bash
git checkout main
git pull origin main
git branch -d feature/nome-da-feature
```

## 🐛 Reportando Bugs

### Informações Necessárias

Ao reportar um bug, inclua:

1. **Descrição clara** - O que aconteceu?
2. **Passos para reproduzir** - Como reproduzir o bug?
3. **Comportamento esperado** - O que deveria acontecer?
4. **Screenshots** - Se aplicável
5. **Ambiente** - Browser, OS, versão do Node
6. **Console logs** - Erros do console
7. **Configuração** - Informações relevantes do ambiente

### Template de Bug Report

```markdown
## Descrição
[Descrição clara e concisa do bug]

## Passos para Reproduzir
1. Acesse a página X
2. Clique em Y
3. Observe o erro Z

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que está acontecendo]

## Screenshots
[Se aplicável]

## Ambiente
- Browser: Chrome 120
- OS: Windows 11
- Node: v18.17.0
- Versão do App: 1.0.0

## Logs
```
[Cole os logs aqui]
```

## Informações Adicionais
[Qualquer outra informação relevante]
```

## 💡 Sugerindo Melhorias

### Informações Necessárias

Ao sugerir melhorias, inclua:

1. **Problema atual** - Qual problema você está tentando resolver?
2. **Solução proposta** - Como você resolveria?
3. **Alternativas** - Quais outras soluções considerou?
4. **Valor** - Qual o benefício da melhoria?
5. **Prioridade** - Quão importante é isso?

### Template de Feature Request

```markdown
## Problema
[Descreva o problema que a feature resolveria]

## Solução Proposta
[Descreva sua solução ideal]

## Alternativas
[Descreva alternativas que você considerou]

## Benefícios
[Liste os benefícios da implementação]

## Complexidade Estimada
[ ] Baixa (< 1 dia)
[ ] Média (1-3 dias)
[ ] Alta (> 3 dias)

## Prioridade
[ ] Crítica
[ ] Alta
[ ] Média
[ ] Baixa

## Informações Adicionais
[Qualquer outra informação relevante]
```

## 📚 Recursos Adicionais

- [Documentação do Projeto](./README.md)
- [Guia de Desenvolvimento](./DEVELOPMENT.md)
- [Documentação da API](./API.md)
- [Guia de Testes](./TESTING.md)
- [Arquitetura](./ARCHITECTURE.md)

## 🙏 Agradecimentos

Obrigado por contribuir com o PrimeGestor! Sua ajuda torna este projeto melhor para todos.

## ❓ Dúvidas?

Se tiver dúvidas sobre como contribuir:
- Abra uma issue com a tag `question`
- Entre em contato com os mantenedores
- Consulte a documentação

---

**Nota**: Este é um documento vivo. Se você identificar melhorias para este guia, abra um PR! 🚀
