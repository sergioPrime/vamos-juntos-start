# 🚀 CI/CD Workflows

Este diretório contém todos os workflows automatizados do GitHub Actions para garantir qualidade e confiabilidade do código.

## 📋 Workflows Disponíveis

### 1. **ci.yml** - Pipeline Principal de CI
**Trigger:** Push em `main`/`develop` ou Pull Requests

**Jobs:**
1. **Lint & Type Check** - Verifica qualidade do código
2. **Tests & Coverage** - Executa testes e verifica cobertura mínima
3. **Build Check** - Valida build e tamanho do bundle
4. **Security Audit** - Verifica vulnerabilidades
5. **Status Check** - Consolida resultado de todos os jobs

**Cobertura Mínima Exigida:** 70% (lines, statements, functions, branches)

**Duração Estimada:** 5-8 minutos

---

### 2. **coverage-report.yml** - Relatório de Cobertura
**Trigger:** 
- Push em `main`
- Diariamente às 6h UTC
- Manual (workflow_dispatch)

**Funcionalidades:**
- Gera badge de cobertura
- Envia relatório para Codecov
- Cria summary em Markdown
- Commita badges atualizados

---

### 3. **pr-check.yml** - Validação de Pull Requests
**Trigger:** PRs abertos, sincronizados ou reabertos

**Validações:**
- ✅ Título do PR segue padrão Conventional Commits
- ✅ Tamanho do PR (avisa se muito grande)
- ✅ Detecta TODOs/FIXMEs
- ✅ Adiciona labels automaticamente

---

## 🔒 Branch Protection Rules

Configure estas regras em `Settings > Branches > Branch protection rules`:

### Para branch `main`:

```yaml
Require a pull request before merging: ✅
  Require approvals: 1
  Dismiss stale pull request approvals: ✅
  Require review from Code Owners: ✅

Require status checks to pass before merging: ✅
  Require branches to be up to date: ✅
  Status checks that are required:
    - Lint & Type Check
    - Tests & Coverage
    - Build Check
    - CI Status Check

Require conversation resolution before merging: ✅
Do not allow bypassing the above settings: ✅
```

### Para branch `develop`:

```yaml
Require a pull request before merging: ✅
  Require approvals: 1

Require status checks to pass before merging: ✅
  Status checks that are required:
    - Lint & Type Check
    - Tests & Coverage
    - Build Check
```

---

## 📊 Badges de Status

Adicione ao seu README.md:

```markdown
[![CI](https://github.com/seu-usuario/seu-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/seu-repo/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/seu-usuario/seu-repo/branch/main/graph/badge.svg)](https://codecov.io/gh/seu-usuario/seu-repo)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](https://github.com/seu-usuario/seu-repo/actions)
```

---

## 🔐 Secrets Necessários

Configure em `Settings > Secrets and variables > Actions`:

### Obrigatórios:
- `CODECOV_TOKEN` - Token do Codecov (para relatórios de cobertura)

### Opcionais:
- `SNYK_TOKEN` - Token do Snyk (para security scanning)

**Como obter tokens:**

1. **Codecov:**
   - Acesse https://codecov.io
   - Conecte seu repositório GitHub
   - Copie o token fornecido

2. **Snyk:**
   - Acesse https://snyk.io
   - Crie conta e autentique com GitHub
   - Gere token em Account Settings

---

## 🚦 Status dos Checks

### ✅ Green (Passa)
- Todos os testes passaram
- Cobertura >= 70%
- Sem erros de lint
- TypeScript compila sem erros
- Build gerado com sucesso

### ❌ Red (Falha)
- Algum teste falhou
- Cobertura < 70%
- Erros de lint ou TypeScript
- Build falhou

### ⏸️ Pending (Pendente)
- Workflow ainda executando
- Aguardando aprovação

---

## 🛠️ Comandos Locais

Antes de criar um PR, execute localmente:

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Testes
npm run test

# Cobertura
npm run test:coverage

# Build
npm run build
```

---

## 🔄 Fluxo de Trabalho

### 1. Criar Feature Branch
```bash
git checkout -b feat/minha-feature
```

### 2. Desenvolver e Testar Localmente
```bash
npm run test:watch
```

### 3. Commitar Mudanças
```bash
git add .
git commit -m "feat(area): descrição da mudança"
```

### 4. Push e Criar PR
```bash
git push origin feat/minha-feature
```

### 5. CI Executa Automaticamente
- Lint & Type Check
- Tests & Coverage
- Build
- Security Audit

### 6. Revisar e Aprovar
- Revisor verifica código
- CI deve estar verde
- Cobertura >= 70%

### 7. Merge para Main
- Squash and merge (recomendado)
- CI executa novamente em main
- Deploy automático (se configurado)

---

## 📈 Métricas de Qualidade

### Targets:
- **Cobertura de Testes:** >= 70%
- **Build Time:** < 2 minutos
- **Bundle Size:** < 500KB (gzipped)
- **Lighthouse Score:** >= 90

### Monitoramento:
- Dashboard do Codecov
- GitHub Actions insights
- Relatórios semanais automáticos

---

## 🚨 Troubleshooting

### Build Falha Localmente mas Passa no CI
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Testes Falham no CI mas Passam Localmente
```bash
# Execute com mesmas variáveis de ambiente
CI=true npm run test
```

### Cobertura Abaixo do Mínimo
```bash
# Veja relatório detalhado
npm run test:coverage
# Abra coverage/index.html no navegador
```

### Erro de Permissão no GitHub Actions
- Verifique se `GITHUB_TOKEN` tem permissões adequadas
- Settings > Actions > General > Workflow permissions

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vitest Docs](https://vitest.dev/)
- [Codecov Docs](https://docs.codecov.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🤝 Contribuindo

1. Leia o [PULL_REQUEST_TEMPLATE.md](../PULL_REQUEST_TEMPLATE.md)
2. Siga os padrões de código
3. Adicione testes para novas features
4. Mantenha cobertura >= 70%
5. Aguarde aprovação do CI

---

**Última atualização:** 2025-11-21  
**Versão:** 1.0.0
