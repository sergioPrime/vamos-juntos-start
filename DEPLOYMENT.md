# 🚀 Guia de Deployment - Prime ERP

**Versão:** 1.0  
**Atualizado em:** 22 de Janeiro de 2025

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Deploy via Lovable](#deploy-via-lovable)
- [Ambientes](#ambientes)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [CI/CD](#cicd)
- [Monitoramento](#monitoramento)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O Prime ERP está hospedado na plataforma Lovable, que gerencia automaticamente:
- ✅ Deploy de frontend (React/Vite)
- ✅ Deploy de backend (Supabase Edge Functions)
- ✅ Migrações de banco de dados
- ✅ SSL/TLS certificates
- ✅ CDN global
- ✅ Builds otimizados

---

## 📦 Pré-requisitos

### Requisitos Mínimos

1. **Projeto Lovable configurado**
   - Conta ativa no Lovable
   - Projeto criado e sincronizado

2. **Supabase Project**
   - Projeto ID: `wrdyffwjlylgxfbxbztf`
   - Database configurado
   - RLS policies ativadas

3. **Credenciais**
   - Supabase URL e Anon Key (já configuradas)
   - Secrets gerenciados via Lovable

---

## 🚀 Deploy via Lovable

### Frontend Deploy

#### 1. Deploy Automático
Lovable detecta mudanças automaticamente:
- ✅ Commit no repositório
- ✅ Build automático
- ✅ Deploy automático
- ✅ Preview URL gerada

#### 2. Deploy Manual
No dashboard do Lovable:
1. Clique em **"Publish"** (canto superior direito)
2. Revise as mudanças
3. Clique em **"Update"**
4. Aguarde confirmação

#### 3. Preview Deploys
- Cada branch gera um preview deploy
- URL: `https://[branch]-[project].lovable.app`
- Ideal para testar features

### Backend Deploy

#### Edge Functions
```typescript
// supabase/functions/[function-name]/index.ts
```

**Deploy é 100% automático:**
- ✅ Mudanças detectadas
- ✅ Build automático
- ✅ Deploy imediato
- ✅ Rollback se houver erro

#### Database Migrations
```sql
-- supabase/migrations/[timestamp]_migration_name.sql
```

**Aplicação automática:**
- ✅ Detecta nova migração
- ✅ Valida SQL
- ✅ Aplica no banco
- ✅ Gera types automaticamente

---

## 🌍 Ambientes

### Staging (Preview)
```
URL: https://wrdyffwjlylgxfbxbztf.lovable.app
Database: Supabase Staging
Purpose: Testes e validação
```

### Production
```
URL: [seu-dominio-custom].com
Database: Supabase Production  
Purpose: Usuários finais
```

### Local Development
```
URL: http://localhost:8080
Database: Supabase (shared)
Purpose: Desenvolvimento
```

---

## 🔐 Variáveis de Ambiente

### Configuração no Lovable

As credenciais já estão configuradas em:
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = "https://wrdyffwjlylgxfbxbztf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGci...";
```

### Secrets Management

Para adicionar secrets adicionais:

1. **Via Lovable Dashboard:**
   - Settings → Secrets
   - Add New Secret
   - Nome: `SECRET_NAME`
   - Valor: [valor secreto]

2. **Uso em Edge Functions:**
```typescript
// supabase/functions/[function]/index.ts
const apiKey = Deno.env.get('API_KEY');
```

### Secrets Recomendados

```
# Externos (se necessário)
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG...
AWS_ACCESS_KEY=...

# Internos (já configurados)
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
```

---

## 🔄 CI/CD

### Pipeline Automático

```
1. Code Push
   ↓
2. Lovable detects change
   ↓
3. Run Tests (via GitHub Actions - opcional)
   ↓
4. Build Frontend
   ↓
5. Deploy Edge Functions
   ↓
6. Run Migrations
   ↓
7. Deploy Frontend
   ↓
8. Generate Preview URL
   ↓
9. ✅ Success / ❌ Rollback
```

### GitHub Actions (Opcional)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npm run build
```

### Quality Gates

Antes de cada deploy, garanta:
- ✅ Todos os testes passando
- ✅ TypeScript sem erros
- ✅ Coverage > 80%
- ✅ Build bem-sucedido
- ✅ Migrações validadas

---

## 📊 Monitoramento

### Métricas Importantes

#### Frontend
- **Performance:** Lighthouse score > 90
- **Uptime:** > 99.9%
- **Load Time:** < 2s
- **Errors:** < 0.1%

#### Backend  
- **API Response Time:** < 200ms
- **Database Query Time:** < 100ms
- **Edge Function Cold Start:** < 500ms
- **Error Rate:** < 0.5%

### Ferramentas de Monitoramento

#### 1. Lovable Analytics
```
Dashboard → Analytics
- Page views
- User sessions
- Error tracking
- Performance metrics
```

#### 2. Supabase Logs
```
https://supabase.com/dashboard/project/wrdyffwjlylgxfbxbztf/logs

Tipos:
- Database logs
- Edge Function logs
- Auth logs
- API logs
```

#### 3. Real User Monitoring (Futuro)
```typescript
// Considerar adicionar:
- Sentry para error tracking
- PostHog para analytics
- LogRocket para session replay
```

### Alertas

Configure alertas para:
- ❌ Build failed
- ❌ Edge function error rate > 1%
- ❌ Database connection errors
- ❌ API latency > 1s
- ⚠️ High memory usage
- ⚠️ Unusual traffic patterns

---

## 🔙 Rollback

### Rollback Rápido

#### Via Lovable Dashboard
1. Settings → Deployments
2. Selecione deploy anterior
3. Clique "Restore"
4. Confirme rollback

#### Via Git
```bash
# Revert último commit
git revert HEAD
git push

# Revert commit específico
git revert <commit-hash>
git push
```

### Rollback de Migração

**⚠️ CUIDADO:** Rollback de banco pode causar perda de dados

```sql
-- Criar migração reversa manual
-- supabase/migrations/[timestamp]_revert_[feature].sql

-- Exemplo: reverter criação de tabela
DROP TABLE IF EXISTS new_table;

-- Exemplo: reverter alteração de coluna
ALTER TABLE existing_table DROP COLUMN new_column;
```

### Estratégia de Rollback

1. **Identifique o problema**
   - Logs de erro
   - User reports
   - Monitoring alerts

2. **Avalie o impacto**
   - Crítico → Rollback imediato
   - Alto → Rollback em < 15min
   - Médio → Fix forward ou rollback
   - Baixo → Fix forward

3. **Execute o rollback**
   - Via Lovable Dashboard (preferido)
   - Via Git revert
   - Comunicar ao time

4. **Verifique a recuperação**
   - Teste funcionalidade
   - Monitore métricas
   - Confirme com usuários

---

## 🐛 Troubleshooting

### Build Failed

#### Erro: "TypeScript errors"
```bash
# Verifique erros de tipo
npm run type-check

# Verifique configuração
cat tsconfig.json
```

**Solução:**
- Corrija erros de TypeScript
- Atualize types do Supabase
- Verifique imports

#### Erro: "Module not found"
```bash
# Verifique package.json
cat package.json

# Reinstale dependências
npm install
```

**Solução:**
- Adicione dependência faltante
- Corrija path de import
- Limpe cache: `rm -rf node_modules`

#### Erro: "Build timeout"
```
ERROR: Build exceeded 15 minute timeout
```

**Solução:**
- Otimize imports dinâmicos
- Reduza bundle size
- Remova dependências não usadas

### Deploy Failed

#### Erro: "Edge function deployment failed"
```
ERROR: Function 'function-name' failed to deploy
```

**Solução:**
1. Verifique logs da function
2. Teste localmente
3. Valide sintaxe Deno
4. Verifique secrets

#### Erro: "Migration failed"
```
ERROR: Migration failed at line X
```

**Solução:**
1. Revise SQL da migração
2. Teste em staging primeiro
3. Verifique dependências (tabelas, colunas)
4. Rollback se necessário

### Runtime Errors

#### Erro: "Supabase connection failed"
```typescript
Error: Failed to fetch
```

**Solução:**
- Verifique Supabase status
- Confirme credenciais
- Verifique RLS policies
- Teste conexão

#### Erro: "Authentication errors"
```
Error: JWT expired / Invalid token
```

**Solução:**
- Limpe localStorage
- Force logout/login
- Verifique session refresh
- Valide auth flow

### Performance Issues

#### Problema: "Slow page load"
**Diagnóstico:**
```bash
# Lighthouse audit
npm run build
npm run preview
# Abra DevTools → Lighthouse
```

**Soluções:**
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

#### Problema: "High memory usage"
**Diagnóstico:**
- Chrome DevTools → Memory
- Check for memory leaks
- Profile components

**Soluções:**
- Fix memory leaks
- Implement virtualization
- Optimize large lists
- Use React.memo

---

## 🔒 Segurança em Produção

### Checklist de Segurança

- [ ] HTTPS habilitado (automático via Lovable)
- [ ] RLS policies em todas as tabelas
- [ ] Secrets não expostos no frontend
- [ ] Validação de input (Zod)
- [ ] Sanitização de dados
- [ ] Rate limiting em APIs
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (CSP, etc)
- [ ] Backups automáticos habilitados
- [ ] Logs de auditoria funcionando

### Conformidade

- **LGPD:** Políticas de privacidade implementadas
- **Dados sensíveis:** Criptografados at rest
- **Backup:** Diário automático via Supabase
- **Auditoria:** Logs de todas as operações

---

## 📈 Otimizações de Performance

### Frontend Optimizations

1. **Code Splitting**
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

2. **Image Optimization**
```tsx
// Use WebP com fallback
<img src="image.webp" alt="..." loading="lazy" />
```

3. **Bundle Size**
```bash
# Análise do bundle
npm run build
npx vite-bundle-visualizer
```

### Backend Optimizations

1. **Database Indexes**
```sql
-- Adicionar índices estratégicos
CREATE INDEX idx_table_column ON table(column);
```

2. **Query Optimization**
```typescript
// Use select específico
.select('id, name, email') // ✅ Bom
.select('*')                // ❌ Evitar
```

3. **Caching**
```typescript
// React Query com staleTime
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000, // 5 min
});
```

---

## 🆘 Suporte e Contatos

### Lovable Support
- Dashboard: https://lovable.dev
- Docs: https://docs.lovable.dev
- Status: https://status.lovable.dev

### Supabase Support
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Status: https://status.supabase.com

### Equipe Interna
- **DevOps:** devops@empresa.com
- **Backend:** backend@empresa.com
- **Frontend:** frontend@empresa.com

---

## 📚 Recursos Adicionais

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Desenvolvimento
- [API.md](./API.md) - APIs
- [TESTING.md](./TESTING.md) - Testes

---

**Mantido por:** Equipe DevOps Prime ERP  
**Última atualização:** 22/01/2025
