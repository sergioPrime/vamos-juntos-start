# 🚀 PrimeGestor - Sistema ERP Completo

<div align="center">

![PrimeGestor](https://img.shields.io/badge/PrimeGestor-v1.0.0-blue?style=for-the-badge)

**Sistema ERP moderno e completo para gestão empresarial**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[![Tests](https://img.shields.io/badge/tests-196%2B-brightgreen?style=flat-square)](./TESTING.md)
[![Coverage](https://img.shields.io/badge/coverage-83%25-green?style=flat-square)](./TESTING.md)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

[Demo](https://primegestor.lovable.app) | [Documentação](#-documentação) | [Contribuir](./CONTRIBUTING.md)

</div>

---

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Começando](#-começando)
- [Documentação](#-documentação)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Contribuindo](#-contribuindo)
- [Segurança](#-segurança)
- [Licença](#-licença)

## 🎯 Sobre o Projeto

O **PrimeGestor** é um sistema ERP (Enterprise Resource Planning) completo, moderno e escalável, desenvolvido para atender às necessidades de gestão empresarial de pequenas e médias empresas.

### ✨ Diferenciais

- **🔐 Segurança Blockchain**: Auditoria imutável de transações críticas
- **🎨 Interface Moderna**: Design responsivo e intuitivo com Tailwind CSS
- **📊 Analytics em Tempo Real**: Dashboards interativos e relatórios avançados
- **🔒 Permissões Granulares**: Controle de acesso por módulo e ação
- **☁️ Multi-tenant**: Suporte a múltiplas organizações
- **📱 PWA**: Funciona como app nativo em dispositivos móveis
- **🌐 Multi-idioma**: Suporte a internacionalização (i18n)

## ⚡ Funcionalidades

### 💰 Módulo Financeiro
- ✅ Contas a Pagar e Receber
- ✅ Conciliação Bancária
- ✅ Fluxo de Caixa
- ✅ Projeções Financeiras
- ✅ DRE e Balanço
- ✅ Gestão de Boletos
- ✅ Plano de Contas
- ✅ Centros de Custo

### 📦 Módulo de Estoque
- ✅ Controle de Produtos
- ✅ Gestão de Lotes e Séries
- ✅ Movimentações de Estoque
- ✅ Alertas de Estoque Mínimo
- ✅ Validade de Produtos
- ✅ Inventário
- ✅ Múltiplos Depósitos

### 🛒 Módulo de Vendas
- ✅ PDV (Ponto de Venda)
- ✅ Pedidos e Orçamentos
- ✅ Gestão de Clientes
- ✅ Tabelas de Preço
- ✅ Comissões
- ✅ Metas de Vendas

### 📈 Módulo CRM
- ✅ Gestão de Leads
- ✅ Pipeline de Vendas
- ✅ Atividades e Tarefas
- ✅ Oportunidades
- ✅ Histórico de Interações

### 🧾 Módulo Fiscal
- ✅ Emissão de NF-e
- ✅ Emissão de NFS-e
- ✅ Cálculo de Impostos
- ✅ Grupos Tributários
- ✅ Operações Fiscais

### 🏭 Módulo de Produção
- ✅ Ordens de Produção
- ✅ Bill of Materials (BOM)
- ✅ Controle de Custos

### 🛍️ Módulo de Compras
- ✅ Requisições de Compra
- ✅ Cotações
- ✅ Pedidos de Compra
- ✅ Gestão de Fornecedores
- ✅ Políticas de Aprovação

### ⚙️ Administração
- ✅ Usuários e Permissões
- ✅ Empresas/Filiais
- ✅ Auditoria Blockchain
- ✅ Logs de Auditoria
- ✅ Integrações
- ✅ Configurações

## 🛠️ Tecnologias

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes
- **React Query** - Gerenciamento de estado
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **Recharts** - Gráficos
- **Framer Motion** - Animações

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados
- **Row Level Security (RLS)** - Segurança
- **Edge Functions** - Serverless
- **Realtime** - Websockets

### DevOps & Qualidade
- **Vitest** - Testes unitários
- **React Testing Library** - Testes de componentes
- **MSW** - Mock de APIs
- **ESLint** - Linter
- **TypeScript** - Type checking
- **GitHub Actions** - CI/CD

## 🚀 Começando

### Pré-requisitos

```bash
# Node.js 18+ e npm
node --version  # v18.0.0+
npm --version   # 9.0.0+
```

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/primegestor.git
cd primegestor
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o .env com suas configurações do Supabase
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse o sistema**
```
http://localhost:5173
```

### Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie as credenciais para o `.env`
3. Execute as migrations conforme documentado

Para mais detalhes, consulte o [Guia de Desenvolvimento](./DEVELOPMENT.md).

## 📚 Documentação

- [📖 Guia de Desenvolvimento](./DEVELOPMENT.md) - Setup e desenvolvimento
- [🚀 Guia de Deploy](./DEPLOYMENT.md) - Deploy e produção
- [🔌 Documentação da API](./API.md) - Endpoints e integrações
- [🧪 Guia de Testes](./TESTING.md) - Testes e qualidade
- [🏗️ Arquitetura](./ARCHITECTURE.md) - Arquitetura do sistema
- [🔒 Política de Segurança](./SECURITY.md) - Segurança e compliance
- [🤝 Guia de Contribuição](./CONTRIBUTING.md) - Como contribuir

## 🧪 Testes

O projeto possui cobertura de testes de **83%** com **196+ testes**.

```bash
# Executar todos os testes
npm test

# Executar com coverage
npm run test:coverage

# Executar em modo watch
npm run test:watch
```

Consulte o [Guia de Testes](./TESTING.md) para mais informações.

## 🌐 Deploy

### Deploy na Vercel (Recomendado)

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Deploy
vercel
```

### Deploy no Netlify

```bash
# Build
npm run build

# Deploy a pasta dist/
netlify deploy --prod --dir=dist
```

Consulte o [Guia de Deploy](./DEPLOYMENT.md) para instruções detalhadas.

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Veja o [Guia de Contribuição](./CONTRIBUTING.md) para saber como:

1. 🍴 Fork o projeto
2. 🔨 Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. ✅ Commit suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. 📤 Push para a branch (`git push origin feature/MinhaFeature`)
5. 🎉 Abra um Pull Request

## 🔒 Segurança

Levamos a segurança a sério. Se você descobrir uma vulnerabilidade:

- **NÃO** abra uma issue pública
- Envie um email para security@primegestor.com
- Consulte nossa [Política de Segurança](./SECURITY.md)

### Recursos de Segurança

- 🔐 Row Level Security (RLS)
- ⛓️ Auditoria Blockchain
- 🔑 Autenticação JWT
- 🛡️ Proteção CSRF
- 📝 Logs de Auditoria
- 🔒 Permissões Granulares

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [Supabase](https://supabase.com) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Lucide](https://lucide.dev) - Ícones

---

<div align="center">

**Feito com ❤️ pela equipe PrimeGestor**

[⬆ Voltar ao topo](#-primegestor---sistema-erp-completo)

</div>
