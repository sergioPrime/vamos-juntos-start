# Política de Segurança

## 🔒 Visão Geral

A segurança é uma prioridade máxima no PrimeGestor. Este documento descreve nossas práticas de segurança e como reportar vulnerabilidades.

## 📋 Sumário

- [Versões Suportadas](#versões-suportadas)
- [Reportando Vulnerabilidades](#reportando-vulnerabilidades)
- [Práticas de Segurança](#práticas-de-segurança)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Proteção de Dados](#proteção-de-dados)
- [Blockchain e Auditoria](#blockchain-e-auditoria)
- [Configurações de Segurança](#configurações-de-segurança)

## 🛡️ Versões Suportadas

| Versão | Suportada          |
| ------ | ------------------ |
| 1.x    | ✅ Sim             |
| < 1.0  | ❌ Não             |

## 🚨 Reportando Vulnerabilidades

### Processo de Reporte

**NÃO** crie issues públicas para vulnerabilidades de segurança. Em vez disso:

1. **Email**: Envie detalhes para security@primegestor.com
2. **Assunto**: `[SECURITY] Breve descrição da vulnerabilidade`
3. **Conteúdo**: Inclua:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de correção (se houver)

### O Que Esperar

- **Confirmação**: Resposta em até 48 horas
- **Avaliação**: Análise da vulnerabilidade em 7 dias
- **Correção**: Patch disponível em 30 dias (dependendo da severidade)
- **Crédito**: Reconhecimento público (se desejado)

### Severidade

Classificamos vulnerabilidades usando CVSS:

- **Crítica** (9.0-10.0): Patch emergencial
- **Alta** (7.0-8.9): Patch prioritário
- **Média** (4.0-6.9): Patch na próxima release
- **Baixa** (0.1-3.9): Correção planejada

## 🔐 Práticas de Segurança

### Desenvolvimento Seguro

#### 1. Validação de Entrada

```typescript
// ✅ Sempre valide entrada do usuário
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
});

// Valide antes de processar
const product = productSchema.parse(userInput);
```

#### 2. Sanitização de Dados

```typescript
// ✅ Sanitize HTML input
import DOMPurify from 'dompurify';

const sanitizedDescription = DOMPurify.sanitize(userDescription);
```

#### 3. SQL Injection Prevention

```typescript
// ✅ Use prepared statements (Supabase protege automaticamente)
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId); // Parâmetro seguro

// ❌ Nunca concatene strings
// const query = `SELECT * FROM products WHERE id = '${productId}'`;
```

#### 4. XSS Prevention

```typescript
// ✅ React escapa automaticamente
<div>{userContent}</div>

// ⚠️ Cuidado com dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

#### 5. CSRF Protection

```typescript
// ✅ Use tokens CSRF para operações críticas
const csrfToken = await generateCSRFToken();
headers['X-CSRF-Token'] = csrfToken;
```

### Segurança de Dependencies

```bash
# Execute regularmente
npm audit

# Atualize vulnerabilidades
npm audit fix

# Para vulnerabilidades críticas
npm audit fix --force
```

## 🔑 Autenticação e Autorização

### Sistema de Autenticação

O PrimeGestor usa Supabase Auth com:
- **JWT tokens** para sessões
- **Refresh tokens** para renovação
- **Multi-fator** (opcional)
- **OAuth** (Google, GitHub)

### Políticas de Senha

```typescript
// Requisitos mínimos
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // dias
  preventReuse: 5, // últimas senhas
};
```

### Row Level Security (RLS)

**Todas as tabelas** usam RLS:

```sql
-- Exemplo: Usuários só veem dados de sua organização
CREATE POLICY "users_org_isolation"
  ON financial_entries
  FOR ALL
  USING (org_id = auth.jwt() ->> 'org_id');
```

### Permissões Granulares

```typescript
// Sistema de permissões por módulo e ação
interface Permission {
  moduleKey: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

// Verifique permissões antes de ações
const { hasPermission } = usePermissionGuard();
if (!hasPermission('financeiro', 'create')) {
  throw new UnauthorizedError();
}
```

## 🛡️ Proteção de Dados

### Dados Sensíveis

#### Armazenamento

- **Senhas**: Hash com bcrypt (12 rounds)
- **Tokens**: Armazenados criptografados
- **PII**: Criptografia em repouso
- **Pagamentos**: Tokenização (nunca armazene cartões)

#### Transmissão

- **HTTPS**: Obrigatório para todas as requisições
- **TLS 1.3**: Versão mínima
- **HSTS**: Headers de segurança
- **CSP**: Content Security Policy

```typescript
// Headers de segurança
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
};
```

### LGPD/GDPR Compliance

#### Direitos do Usuário

- **Acesso**: Exportação de dados pessoais
- **Retificação**: Correção de dados incorretos
- **Exclusão**: Direito ao esquecimento
- **Portabilidade**: Formato legível por máquina
- **Objeção**: Opt-out de processamento

#### Implementação

```typescript
// Exportação de dados
export async function exportUserData(userId: string) {
  const data = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return {
    format: 'json',
    data: data.data,
    requestedAt: new Date(),
  };
}

// Exclusão de dados
export async function deleteUserData(userId: string) {
  // Anonimiza dados históricos
  await anonymizeHistoricalData(userId);
  
  // Remove dados pessoais
  await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
}
```

## ⛓️ Blockchain e Auditoria

### Sistema de Blockchain

O PrimeGestor usa blockchain para auditoria:

```typescript
// Registro imutável de transações críticas
interface BlockchainRecord {
  id: string;
  blockNumber: number;
  previousHash: string;
  currentHash: string;
  tableName: string;
  recordId: string;
  dataSnapshot: any;
  transactionType: 'INSERT' | 'UPDATE' | 'DELETE';
  userId: string;
  timestamp: string;
}
```

### Alertas de Segurança

```typescript
// Sistema de alertas para eventos suspeitos
interface SecurityAlert {
  alertType: 'tampering' | 'unauthorized_access' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  blockId?: string;
  userId?: string;
}
```

### Validação de Integridade

```bash
# Execute periodicamente para validar integridade da blockchain
npm run blockchain:validate
```

## ⚙️ Configurações de Segurança

### Variáveis de Ambiente

```bash
# .env.example (nunca commite .env real)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key # Apenas backend!

# Segurança
SESSION_SECRET=generate-secure-random-string
ENCRYPTION_KEY=generate-secure-encryption-key
CSRF_SECRET=generate-secure-csrf-secret

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000 # 15 minutos
```

### Supabase Security

```sql
-- Habilite RLS em todas as tabelas
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Configure políticas restritivas
CREATE POLICY "restrictive_policy"
  ON table_name
  FOR ALL
  USING (false); -- Negar por padrão

-- Adicione políticas específicas
CREATE POLICY "specific_access"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id AND org_id = current_org_id());
```

### Edge Functions

```typescript
// Sempre valide autenticação
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response('Unauthorized', { status: 401 });
}

// Valide tokens
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

if (error || !user) {
  return new Response('Invalid token', { status: 401 });
}
```

## 🔍 Auditoria e Monitoramento

### Logs de Auditoria

```typescript
// Registre ações críticas
await auditLog({
  action: 'DELETE_FINANCIAL_ENTRY',
  entityType: 'financial_entries',
  entityId: entryId,
  userId: user.id,
  orgId: org.id,
  metadata: { amount, description },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Monitoramento

- **Alertas em tempo real** para ações suspeitas
- **Dashboard de segurança** para administradores
- **Relatórios periódicos** de auditoria
- **Integração com SIEM** (opcional)

## 📚 Recursos Adicionais

### Ferramentas de Segurança

- **OWASP ZAP**: Testes de penetração
- **npm audit**: Vulnerabilidades de dependências
- **Snyk**: Monitoramento contínuo
- **SonarQube**: Análise de código

### Checklist de Segurança

```markdown
- [ ] RLS habilitado em todas as tabelas
- [ ] Validação de entrada implementada
- [ ] Sanitização de dados implementada
- [ ] HTTPS obrigatório
- [ ] Headers de segurança configurados
- [ ] Autenticação multi-fator disponível
- [ ] Logs de auditoria implementados
- [ ] Backup regular dos dados
- [ ] Plano de resposta a incidentes
- [ ] Treinamento de segurança da equipe
```

## 📞 Contato

Para questões de segurança:
- **Email**: security@primegestor.com
- **PGP Key**: [Disponível em keybase.io/primegestor]

## 🙏 Agradecimentos

Agradecemos aos pesquisadores de segurança que reportam vulnerabilidades de forma responsável.

---

**Última atualização**: 2025-01-22
**Versão**: 1.0.0
