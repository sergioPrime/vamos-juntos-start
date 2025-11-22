# 🔄 FASE 2 NFC-e: EMISSÃO E CONTINGÊNCIA

**Status:** 🔄 EM ANDAMENTO  
**Data:** 22/11/2025

## Objetivos da Fase 2
1. Interface completa de gerenciamento de NFC-e
2. Configuração fiscal visual
3. Sistema de contingência com interface
4. Listagem e filtros de notas

## Realizações

### 1. Página de Gerenciamento ✅
**Arquivo:** `src/pages/fiscal/NFCe.tsx`

Funcionalidades implementadas:
- ✅ Listagem de todas as NFC-e da organização
- ✅ Filtros por status (autorizada, rejeitada, cancelada, etc.)
- ✅ Busca por número, chave de acesso ou cliente
- ✅ Cards de resumo (total, autorizadas, rejeitadas, valor total)
- ✅ Indicador visual de contingência
- ✅ Badge diferenciado para notas em contingência
- ✅ Tabela responsiva com dados principais
- ✅ Ações rápidas (visualizar, baixar, cancelar)

**Componentes visuais:**
- Header com título e botão "Nova NFC-e"
- Alert de contingência ativa (quando aplicável)
- 4 cards de resumo com métricas principais
- Filtros de busca e status
- Tabela com paginação

### 2. Diálogo de Configuração ✅
**Arquivo:** `src/components/fiscal/NFCeConfigDialog.tsx`

Abas implementadas:

**Aba Geral:**
- Série da NFC-e (1-999)
- Número atual (readonly, auto-gerenciado)
- Ambiente (Homologação/Produção)

**Aba Segurança:**
- CSC (Código de Segurança do Contribuinte)
- ID CSC (identificador do código)
- Ícone de segurança e descrições claras

**Aba Avançado:**
- Toggle de modo contingência
- Botão de teste de conexão com SEFAZ
- Validações em tempo real

**Características:**
- Formulário com validação Zod
- Design com tabs para organização
- Botões de ação (Salvar/Cancelar)
- Feedback visual de loading
- Integração direta com `fiscal_config`

### 3. Banner de Contingência ✅
**Arquivo:** `src/components/fiscal/ContingencyBanner.tsx`

Recursos:
- Alert amarelo destacado quando contingência ativa
- Exibe data/hora de ativação
- Contador de notas pendentes na fila
- Botão "Sincronizar" para tentar envio imediato
- Botão "Desativar" para voltar ao modo normal
- Ícone de Wi-Fi off para indicar modo offline
- Integração com `useContingencyMode` hook

## Estrutura de Interface

### Layout da Página NFCe
```
┌─────────────────────────────────────────────┐
│ Header: NFC-e + Botão "Nova NFC-e"          │
├─────────────────────────────────────────────┤
│ [Alert Contingência] (se ativo)             │
├─────────────────────────────────────────────┤
│ Cards Resumo (4 colunas)                    │
│ • Total  • Autorizadas  • Rejeitadas  • R$  │
├─────────────────────────────────────────────┤
│ Filtros                                     │
│ • Busca   • Status                          │
├─────────────────────────────────────────────┤
│ Tabela de NFC-e                             │
│ • Número • Série • Cliente • Data • Tipo    │
│ • Valor  • Status  • Ações                  │
└─────────────────────────────────────────────┘
```

### Diálogo de Configuração
```
┌─────────────────────────────────────────┐
│ Configuração de NFC-e                   │
├─────────────────────────────────────────┤
│ [Geral] [Segurança] [Avançado]          │
├─────────────────────────────────────────┤
│                                         │
│ [Campos de formulário]                  │
│                                         │
├─────────────────────────────────────────┤
│            [Cancelar] [Salvar]          │
└─────────────────────────────────────────┘
```

## Fluxo de Uso

### Configuração Inicial
1. Usuário acessa página de NFC-e
2. Clica em "Configurações"
3. Preenche dados nas 3 abas:
   - **Geral**: Série e ambiente
   - **Segurança**: CSC e ID CSC
   - **Avançado**: Teste de conexão
4. Salva configuração

### Emissão Normal
1. Sistema verifica se há configuração válida
2. Obtém próximo número sequencial
3. Gera chave de acesso
4. Envia para SEFAZ via edge function
5. Recebe protocolo de autorização
6. Atualiza status para "autorizada"
7. Exibe nota na listagem

### Emissão em Contingência
1. Sistema detecta falha na SEFAZ
2. Ativa automaticamente modo contingência
3. Emite nota com status "processando"
4. Adiciona à fila de sincronização
5. Exibe banner de contingência
6. Usuário pode sincronizar manualmente
7. Quando SEFAZ voltar, sincroniza automaticamente

## Status Visuais

### Badges de Status
- **Rascunho**: Secondary (cinza)
- **Processando**: Default (azul)
- **Autorizada**: Default (verde)
- **Rejeitada**: Destructive (vermelho)
- **Cancelada**: Outline (cinza borda)
- **Denegada**: Destructive (vermelho)

### Badges de Tipo
- **Normal**: Outline simples
- **Contingência**: Amarelo com ícone de alerta

## Integrações

### Hooks Utilizados
- `useContingencyMode`: Gerenciamento de contingência
- `useOrganization`: Contexto da organização
- `useNFCe`: Operações de NFC-e (implementado na Fase 1)
- `useToast`: Notificações

### Edge Functions
- `emit-nfce`: Emissão de notas
- `cancel-nfce`: Cancelamento
- `query-nfce-status`: Consulta

### Tabelas do Banco
- `nfce`: Dados principais das notas
- `nfce_items`: Itens das notas
- `nfce_contingencia_queue`: Fila de sincronização
- `fiscal_config`: Configurações fiscais

## Próximos Passos

### Implementações Pendentes
1. **Formulário de Nova NFC-e**
   - Seleção de produtos
   - Dados do cliente
   - Cálculos automáticos
   - Preview antes de emitir

2. **Detalhamento de Nota**
   - Visualização completa
   - Download de XML
   - Impressão de DANFE
   - QR Code para consulta

3. **Cancelamento**
   - Modal de confirmação
   - Campo de motivo obrigatório
   - Validação de prazo (24h)
   - Atualização em tempo real

4. **Sincronização Automática**
   - Job em background
   - Retry com backoff exponencial
   - Notificações de sucesso/falha
   - Log de tentativas

5. **Validações Avançadas**
   - Verificação de campos obrigatórios
   - Validação de CPF/CNPJ
   - Cálculo de impostos
   - Verificação de estoque

## Melhorias Futuras

### Performance
- Paginação server-side
- Cache de queries
- Lazy loading de componentes
- Virtual scrolling na tabela

### UX
- Atalhos de teclado
- Modo offline completo
- Notificações push
- Impressão em lote

### Segurança
- Upload de certificado A1
- Criptografia de CSC
- Logs de auditoria
- 2FA para operações críticas

## Testes Necessários

### Unitários
- [ ] Componente NFCe
- [ ] NFCeConfigDialog
- [ ] ContingencyBanner

### Integração
- [ ] Fluxo de emissão normal
- [ ] Fluxo de contingência
- [ ] Sincronização da fila
- [ ] Cancelamento de nota

### E2E
- [ ] Configuração inicial
- [ ] Emissão de primeira nota
- [ ] Ativação de contingência
- [ ] Sincronização manual

## Observações

1. **Types do Supabase**: Após deploy, regenerar types para remover `as any`
2. **Certificado Digital**: Implementação pendente para produção
3. **QR Code**: Será implementado na visualização de DANFE
4. **Validações**: Regras de negócio serão expandidas conforme necessário

---

**Próxima Fase:** Fase 3 - Operações Auxiliares (Cancelamento, Inutilização, Consultas)
