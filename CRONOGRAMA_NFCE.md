# 📋 CRONOGRAMA DE IMPLEMENTAÇÃO NFC-e

**Projeto:** Sistema de Emissão de NFC-e  
**Data de Criação:** 22 de Novembro de 2025  
**Status Atual:** Fase 1 - Infraestrutura Base

---

## 🎯 VISÃO GERAL

### Objetivo
Implementar sistema completo de emissão de NFC-e (Nota Fiscal de Consumidor Eletrônica) integrado ao PDV, com suporte a:
- Emissão normal via SEFAZ
- Modo de contingência off-line
- Cancelamento e inutilização
- Impressão de DANFE NFC-e
- Consulta de status
- Sincronização automática

### Estrutura das Fases
```
FASE 1: Infraestrutura Base (2 dias)
  ├── Tabelas e migrations
  ├── Edge functions SEFAZ
  └── Hooks básicos

FASE 2: Emissão e Contingência (3 dias)
  ├── Fluxo de emissão normal
  ├── Modo de contingência
  └── Sincronização automática

FASE 3: Operações Auxiliares (2 dias)
  ├── Cancelamento
  ├── Inutilização
  └── Consulta de status

FASE 4: Interface e Configuração (2 dias)
  ├── Configuração fiscal
  ├── Diálogos e formulários
  └── Visualização de notas

FASE 5: Integração PDV (2 dias)
  ├── Emissão automática no PDV
  ├── Configurações do PDV
  └── Tratamento de erros
```

---

## ✅ FASE 1: INFRAESTRUTURA BASE

**Duração:** 2 dias  
**Status:** 🔄 EM ANDAMENTO  
**Prioridade:** 🔥 CRÍTICA

### Objetivos
1. Criar estrutura de dados para NFC-e
2. Implementar edge functions para comunicação com SEFAZ
3. Criar hooks básicos de acesso aos dados

### Entregáveis

#### 1.1 Database Schema

**Tabela: `nfce`**
```sql
- id (uuid, PK)
- org_id (uuid, FK)
- numero (integer) - número sequencial
- serie (integer) - série da nota
- chave_acesso (string) - chave de 44 dígitos
- protocolo (string) - protocolo de autorização
- status (enum: rascunho, processando, autorizada, rejeitada, cancelada)
- tipo_emissao (enum: normal, contingencia)
- data_emissao (timestamp)
- data_autorizacao (timestamp)
- data_cancelamento (timestamp)
- motivo_cancelamento (text)

# Dados do Destinatário
- destinatario_cpf (string)
- destinatario_nome (string)
- destinatario_endereco (jsonb)

# Totalizadores
- valor_produtos (decimal)
- valor_desconto (decimal)
- valor_frete (decimal)
- valor_total (decimal)
- valor_tributos (decimal)

# Contingência
- contingencia_motivo (text)
- contingencia_data_hora (timestamp)
- sincronizado (boolean)

# Relacionamentos
- pedido_id (uuid, FK) - pedido origem
- usuario_id (uuid, FK) - usuário emissor

# XML e Metadados
- xml_enviado (text)
- xml_autorizado (text)
- xml_cancelamento (text)
- metadados (jsonb) - informações adicionais

# Auditoria
- created_at (timestamp)
- updated_at (timestamp)
```

**Tabela: `nfce_items`**
```sql
- id (uuid, PK)
- nfce_id (uuid, FK)
- ordem (integer) - ordem do item
- produto_id (uuid, FK)
- codigo_produto (string)
- descricao (string)
- ncm (string)
- cfop (string)
- unidade (string)
- quantidade (decimal)
- valor_unitario (decimal)
- valor_desconto (decimal)
- valor_total (decimal)

# Tributação
- icms_situacao_tributaria (string)
- icms_aliquota (decimal)
- icms_valor (decimal)
- pis_situacao_tributaria (string)
- pis_aliquota (decimal)
- pis_valor (decimal)
- cofins_situacao_tributaria (string)
- cofins_aliquota (decimal)
- cofins_valor (decimal)

- created_at (timestamp)
- updated_at (timestamp)
```

**Tabela: `nfce_contingencia_queue`**
```sql
- id (uuid, PK)
- org_id (uuid, FK)
- nfce_id (uuid, FK)
- data_emissao (timestamp)
- tentativas (integer)
- ultima_tentativa (timestamp)
- erro (text)
- sincronizado (boolean)
- created_at (timestamp)
```

**Tabela: `fiscal_config`** (expandir a existente)
```sql
# Adicionar campos:
- nfce_serie (integer)
- nfce_numero_atual (integer)
- nfce_csc (string) - Código de Segurança do Contribuinte
- nfce_id_csc (integer)
- nfce_contingencia_ativa (boolean)
- nfce_ambiente (enum: homologacao, producao)
```

#### 1.2 Edge Functions

**Function: `emit-nfce`**
- Comunicação com SEFAZ para autorização
- Validação de dados obrigatórios
- Geração de XML no padrão SEFAZ
- Assinatura digital
- Envio para autorização
- Processamento de retorno

**Function: `cancel-nfce`**
- Cancelamento de NFC-e autorizada
- Validação de prazo (24h)
- Geração de XML de cancelamento
- Envio para SEFAZ
- Atualização de status

**Function: `query-nfce-status`**
- Consulta situação atual da NFC-e
- Retorno de protocolo e status
- Recuperação de XML autorizado

**Function: `inutilize-nfce-range`**
- Inutilização de faixa de numeração
- Validação de sequência
- Registro no banco de dados

#### 1.3 Hooks

**`useNFCe.ts`**
```typescript
export function useNFCe() {
  const emitNFCe = async (data: NFCeData) => {...}
  const cancelNFCe = async (id: string, motivo: string) => {...}
  const queryNFCeStatus = async (chaveAcesso: string) => {...}
  const inutilizeRange = async (inicio: number, fim: number) => {...}
  
  return {
    emitNFCe,
    cancelNFCe,
    queryNFCeStatus,
    inutilizeRange
  }
}
```

**`useContingencyMode.ts`**
```typescript
export function useContingencyMode() {
  const { isActive, activatedAt } = useContingencyStatus()
  const activateContingency = async (motivo: string) => {...}
  const deactivateContingency = async () => {...}
  const addToQueue = async (nfceData: NFCeData) => {...}
  const syncQueue = async () => {...}
  
  return {
    isActive,
    activatedAt,
    activateContingency,
    deactivateContingency,
    addToQueue,
    syncQueue
  }
}
```

### Critérios de Sucesso
- [x] Tabelas criadas com RLS
- [x] Edge functions funcionais
- [x] Hooks implementados
- [ ] Testes básicos passando
- [ ] Documentação completa

---

## 🔄 FASE 2: EMISSÃO E CONTINGÊNCIA

**Duração:** 3 dias  
**Status:** ⏳ PENDENTE  
**Prioridade:** 🔥 CRÍTICA

### Objetivos
1. Implementar fluxo completo de emissão
2. Sistema de contingência off-line
3. Sincronização automática

### Entregáveis

#### 2.1 Fluxo de Emissão Normal
- Validação de dados obrigatórios
- Numeração sequencial automática
- Geração de chave de acesso
- Envio para SEFAZ
- Processamento de retorno
- Armazenamento de XML
- Atualização de status

#### 2.2 Modo de Contingência
- Detecção automática de indisponibilidade SEFAZ
- Ativação manual de contingência
- Emissão off-line com numeração reservada
- Fila de sincronização
- Tentativas automáticas de envio
- Notificação de sucesso/falha

#### 2.3 Sincronização
- Job automático de sincronização
- Retry com backoff exponencial
- Priorização por data de emissão
- Log de tentativas
- Relatório de sincronização

### Critérios de Sucesso
- [ ] Emissão normal 100% funcional
- [ ] Contingência ativando automaticamente
- [ ] Sincronização automática funcionando
- [ ] Taxa de sucesso >95%

---

## 🔧 FASE 3: OPERAÇÕES AUXILIARES

**Duração:** 2 dias  
**Status:** ⏳ PENDENTE  
**Prioridade:** 🟡 ALTA

### Objetivos
1. Cancelamento de NFC-e
2. Inutilização de numeração
3. Consulta de status

### Entregáveis

#### 3.1 Cancelamento
- Interface de cancelamento
- Validação de prazo (24h)
- Motivo obrigatório
- Confirmação do usuário
- Envio para SEFAZ
- Atualização de status
- Reimpressão com cancelamento

#### 3.2 Inutilização
- Interface de inutilização
- Validação de faixa numérica
- Justificativa obrigatória
- Registro permanente
- Impedimento de uso futuro

#### 3.3 Consulta
- Consulta por chave de acesso
- Consulta por número/série
- Exibição de status completo
- Download de XML
- Histórico de eventos

### Critérios de Sucesso
- [ ] Cancelamento em <5s
- [ ] Inutilização funcionando
- [ ] Consultas rápidas (<2s)

---

## 🎨 FASE 4: INTERFACE E CONFIGURAÇÃO

**Duração:** 2 dias  
**Status:** ⏳ PENDENTE  
**Prioridade:** 🟡 ALTA

### Objetivos
1. Configuração fiscal completa
2. Interface de gerenciamento
3. Visualização e impressão

### Entregáveis

#### 4.1 Configuração Fiscal
- Formulário de configuração
- Upload de certificado A1
- Configuração de série/numeração
- CSC e ID CSC
- Ambiente (homologação/produção)
- Validação de certificado
- Teste de conectividade

#### 4.2 Gerenciamento de Notas
- Listagem de NFC-e
- Filtros avançados
- Pesquisa por chave/número
- Ações em lote
- Exportação de relatórios

#### 4.3 Visualização
- Visualização de XML
- Download de arquivos
- Impressão de DANFE NFC-e
- QR Code para consulta
- Histórico de eventos
- Timeline de status

### Critérios de Sucesso
- [ ] Configuração intuitiva
- [ ] Interface responsiva
- [ ] Impressão funcionando
- [ ] UX fluída

---

## 🔗 FASE 5: INTEGRAÇÃO PDV

**Duração:** 2 dias  
**Status:** ⏳ PENDENTE  
**Prioridade:** 🔥 CRÍTICA

### Objetivos
1. Integração automática com PDV
2. Configurações específicas do PDV
3. Tratamento de erros

### Entregáveis

#### 5.1 Emissão Automática
- Hook `usePDVNFCe`
- Conversão de dados do pedido
- Emissão automática pós-venda
- Fallback para contingência
- Notificação ao usuário
- Impressão automática (opcional)

#### 5.2 Configurações PDV
- Emissão automática on/off
- Imprimir após emissão
- Solicitar CPF na nota
- Timeout de emissão
- Ação em caso de falha

#### 5.3 Tratamento de Erros
- Retry automático
- Fallback para contingência
- Notificações visuais
- Log de erros
- Opções de recuperação
- Emissão manual

### Critérios de Sucesso
- [ ] Integração transparente
- [ ] Zero interrupção no PDV
- [ ] Erros tratados gracefully
- [ ] Performance <3s

---

## 📊 MÉTRICAS DE SUCESSO

### Performance
- Emissão normal: <5s
- Emissão contingência: <1s
- Sincronização: <10s/nota
- Consulta: <2s

### Qualidade
- Taxa de sucesso: >95%
- Uptime: >99%
- Erros críticos: 0
- Bugs reportados: <5

### Usabilidade
- Configuração: <10min
- Emissão manual: <30s
- Aprendizado: <2h
- Satisfação: >4.5/5

---

## 🚨 RISCOS E MITIGAÇÃO

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Indisponibilidade SEFAZ | Alta | Alto | Modo de contingência |
| Certificado inválido | Média | Alto | Validação prévia |
| Erro na numeração | Baixa | Crítico | Controle transacional |
| Perda de dados | Baixa | Crítico | Backups automáticos |
| Performance | Média | Médio | Cache e otimizações |

---

## 📝 PRÓXIMOS PASSOS

### Imediato (Fase 1)
1. ✅ Criar migration com tabelas
2. ✅ Implementar edge functions
3. ✅ Criar hooks básicos
4. [ ] Testes unitários
5. [ ] Documentação

### Curto Prazo (Fase 2-3)
1. Fluxo de emissão completo
2. Sistema de contingência
3. Operações auxiliares

### Médio Prazo (Fase 4-5)
1. Interface completa
2. Integração PDV
3. Testes E2E

---

## 📚 REFERÊNCIAS

- [Manual de Integração NFC-e](https://www.nfe.fazenda.gov.br/)
- [Especificações Técnicas](https://www.nfe.fazenda.gov.br/portal/principal.aspx)
- [Layout XML NFC-e 4.00](http://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=/Y0pBYKwBs00=)
- [Contingência Off-line](http://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=tW+YMyk/50s=)

---

**Última Atualização:** 22/11/2025  
**Próxima Revisão:** Após conclusão de cada fase
