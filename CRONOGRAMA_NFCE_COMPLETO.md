# 📋 Cronograma Completo - Implementação NFC-e

## 🎯 Objetivo
Implementar um sistema completo de emissão de NFC-e (Nota Fiscal de Consumidor Eletrônica) integrado com SEFAZ, incluindo contingência offline, impressão, cancelamento e relatórios.

---

## 📊 Visão Geral do Projeto

### Status Atual ✅
- [x] Tabelas `nfce` e `nfce_items` criadas
- [x] Edge function `emitir-nfce` básica (simulação)
- [x] Hook `useNFCe` básico
- [x] Formulário de emissão básico
- [x] Listagem de NFC-e

### Pendente 🔄
- [ ] Integração real com SEFAZ
- [ ] Geração de QR Code
- [ ] Impressão do DANFE NFC-e
- [ ] Cancelamento
- [ ] Contingência offline
- [ ] Validações fiscais completas
- [ ] Integração com PDV
- [ ] Relatórios

---

## 🗓️ FASE 1: Fundação e Configurações (3-4 dias)

### 1.1 - Configurações Fiscais NFC-e (1 dia)
**Objetivo:** Adicionar campos específicos para NFC-e na configuração fiscal

**Tarefas:**
- [ ] Adicionar campos na tabela `fiscal_config`:
  - `csc_producao` (TEXT): Código de Segurança do Contribuinte (produção)
  - `csc_id_producao` (INTEGER): ID do CSC (produção)
  - `csc_homologacao` (TEXT): CSC para ambiente de testes
  - `csc_id_homologacao` (INTEGER): ID do CSC (homologação)
  - `serie_nfce` (TEXT): Série da NFC-e (padrão '1')
  - `proximo_numero_nfce` (INTEGER): Próximo número da NFC-e
  - `token_contingencia` (TEXT): Token para emissão em contingência
  - `impressora_padrao` (TEXT): Nome da impressora para DANFE

**Arquivo:** Migration para adicionar campos

```sql
ALTER TABLE public.fiscal_config
ADD COLUMN csc_producao TEXT,
ADD COLUMN csc_id_producao INTEGER,
ADD COLUMN csc_homologacao TEXT,
ADD COLUMN csc_id_homologacao INTEGER,
ADD COLUMN serie_nfce TEXT DEFAULT '1',
ADD COLUMN proximo_numero_nfce INTEGER DEFAULT 1,
ADD COLUMN token_contingencia TEXT,
ADD COLUMN impressora_padrao TEXT;
```

---

### 1.2 - Validações e Regras de Negócio (1 dia)
**Objetivo:** Implementar validações fiscais obrigatórias

**Tarefas:**
- [ ] Criar função `validate_nfce_emission()`:
  - Validar certificado digital ativo
  - Validar CSC configurado
  - Validar dados do emitente completos
  - Validar CFOP dos itens
  - Validar NCM quando obrigatório
  - Validar valores (total = soma dos itens + impostos)

**Arquivo:** `supabase/migrations/[timestamp]_nfce_validations.sql`

```sql
CREATE OR REPLACE FUNCTION public.validate_nfce_emission(p_org_id UUID)
RETURNS TABLE(is_valid BOOLEAN, errors TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_errors TEXT[] := '{}';
  v_config RECORD;
BEGIN
  -- Buscar configuração fiscal
  SELECT * INTO v_config
  FROM public.fiscal_config
  WHERE org_id = p_org_id AND is_active = true;
  
  IF NOT FOUND THEN
    v_errors := array_append(v_errors, 'Configuração fiscal não encontrada');
  ELSE
    -- Validar certificado
    IF v_config.certificate_pfx IS NULL THEN
      v_errors := array_append(v_errors, 'Certificado digital não configurado');
    END IF;
    
    IF v_config.certificate_expires_at < now() THEN
      v_errors := array_append(v_errors, 'Certificado digital expirado');
    END IF;
    
    -- Validar CSC
    IF v_config.ambiente = 'producao' THEN
      IF v_config.csc_producao IS NULL OR v_config.csc_id_producao IS NULL THEN
        v_errors := array_append(v_errors, 'CSC de produção não configurado');
      END IF;
    ELSE
      IF v_config.csc_homologacao IS NULL OR v_config.csc_id_homologacao IS NULL THEN
        v_errors := array_append(v_errors, 'CSC de homologação não configurado');
      END IF;
    END IF;
    
    -- Validar dados do emitente
    IF v_config.cnpj IS NULL OR v_config.inscricao_estadual IS NULL THEN
      v_errors := array_append(v_errors, 'Dados do emitente incompletos');
    END IF;
  END IF;
  
  RETURN QUERY SELECT (array_length(v_errors, 1) IS NULL), v_errors;
END;
$$;
```

---

### 1.3 - Tabela de Logs de Transmissão (1 dia)
**Objetivo:** Registrar todas as tentativas de comunicação com SEFAZ

**Tarefas:**
- [ ] Criar tabela `nfce_transmission_logs`
- [ ] Criar índices
- [ ] Criar RLS policies
- [ ] Criar função para limpar logs antigos

**Arquivo:** `supabase/migrations/[timestamp]_nfce_transmission_logs.sql`

```sql
CREATE TABLE public.nfce_transmission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfce_id UUID NOT NULL REFERENCES public.nfce(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Tipo de operação
  operation_type TEXT NOT NULL, -- 'emission', 'cancellation', 'query'
  
  -- Request/Response
  request_xml TEXT,
  response_xml TEXT,
  request_json JSONB,
  response_json JSONB,
  
  -- Status
  success BOOLEAN NOT NULL DEFAULT false,
  status_code TEXT,
  error_message TEXT,
  sefaz_message TEXT,
  
  -- Timing
  request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_timestamp TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_nfce_transmission_logs_nfce_id ON public.nfce_transmission_logs(nfce_id);
CREATE INDEX idx_nfce_transmission_logs_org_id ON public.nfce_transmission_logs(org_id);
CREATE INDEX idx_nfce_transmission_logs_created_at ON public.nfce_transmission_logs(created_at);

-- RLS
ALTER TABLE public.nfce_transmission_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs from their organization"
  ON public.nfce_transmission_logs FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()));
```

---

## 🗓️ FASE 2: Integração com SEFAZ (5-7 dias)

### 2.1 - Biblioteca de Comunicação SEFAZ (2 dias)
**Objetivo:** Criar edge function para comunicação real com SEFAZ

**Tarefas:**
- [ ] Criar `supabase/functions/sefaz-nfce-transmit/index.ts`
- [ ] Implementar assinatura digital XML com certificado A1
- [ ] Implementar comunicação SOAP com webservices SEFAZ
- [ ] Implementar tratamento de erros SEFAZ
- [ ] Adicionar retry logic
- [ ] Implementar cache de respostas

**Arquivo:** `supabase/functions/sefaz-nfce-transmit/index.ts`

**Dependências a instalar:**
```typescript
// Bibliotecas necessárias (usar via npm.esm.sh ou deno.land)
import { XMLParser, XMLBuilder } from "https://esm.sh/fast-xml-parser@4.3.2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
```

**Estrutura básica:**
```typescript
interface NFeTransmissionRequest {
  nfce_id: string;
  xml: string;
  certificate: {
    pfx: string;
    password: string;
  };
  ambiente: 'producao' | 'homologacao';
}

// Funções principais:
// - signXML(): Assinar XML com certificado
// - buildSOAPEnvelope(): Criar envelope SOAP
// - sendToSEFAZ(): Enviar para SEFAZ
// - parseResponse(): Processar resposta
// - handleRetries(): Lógica de retry
```

---

### 2.2 - Geração do XML NFC-e (2 dias)
**Objetivo:** Gerar XML conforme layout da NFC-e versão 4.00

**Tarefas:**
- [ ] Criar função `generate_nfce_xml()` no edge function
- [ ] Implementar tags obrigatórias:
  - `<infNFe>`: Informações da NFC-e
  - `<ide>`: Identificação
  - `<emit>`: Emitente
  - `<dest>`: Destinatário (opcional)
  - `<det>`: Detalhamento de produtos
  - `<total>`: Totais
  - `<transp>`: Transporte (não aplicável)
  - `<pag>`: Pagamento
  - `<infAdic>`: Informações adicionais
- [ ] Calcular Chave de Acesso
- [ ] Calcular Dígito Verificador
- [ ] Validar XML contra schema XSD

**Arquivo:** `supabase/functions/sefaz-nfce-transmit/xml-generator.ts`

```typescript
interface NFCeXMLData {
  numero: number;
  serie: string;
  dataEmissao: Date;
  emitente: {
    cnpj: string;
    razaoSocial: string;
    // ... outros campos
  };
  destinatario?: {
    // dados do destinatário
  };
  items: Array<{
    // dados dos itens
  }>;
  pagamento: {
    forma: string;
    valor: number;
  };
}

export function generateNFCeXML(data: NFCeXMLData): string {
  // Implementar geração do XML
}

export function calculateAccessKey(data: NFCeXMLData): string {
  // Calcular chave de acesso (44 dígitos)
}
```

---

### 2.3 - Geração do QR Code (1 dia)
**Objetivo:** Gerar QR Code conforme especificação da SEFAZ

**Tarefas:**
- [ ] Implementar função `generate_qrcode_url()`
- [ ] Montar URL com parâmetros corretos
- [ ] Calcular hash SHA-1 para validação
- [ ] Gerar QR Code (biblioteca)
- [ ] Salvar QR Code no banco

**Arquivo:** `supabase/functions/sefaz-nfce-transmit/qrcode-generator.ts`

```typescript
export function generateQRCodeURL(params: {
  chaveAcesso: string;
  ambiente: 'producao' | 'homologacao';
  dhEmi: string;
  vNF: string;
  digVal: string;
  csc: string;
  cscId: number;
}): string {
  // Formato da URL:
  // {URL_CONSULTA}?p={chave}|2|{ambiente}|{dhEmi}|{valor}|{digVal}|{hash}
  
  const urlBase = params.ambiente === 'producao' 
    ? 'http://www.fazenda.sp.gov.br/nfce/consulta'
    : 'http://www.homologacao.fazenda.sp.gov.br/nfce/consulta';
  
  const hashData = `${params.chaveAcesso}|2|${params.ambiente}|${params.dhEmi}|${params.vNF}|${params.digVal}|${params.cscId}${params.csc}`;
  
  const hash = crypto.subtle.digest('SHA-1', new TextEncoder().encode(hashData));
  
  return `${urlBase}?p=${params.chaveAcesso}|2|${params.ambiente}|${params.dhEmi}|${params.vNF}|${params.digVal}|${hash}`;
}
```

---

### 2.4 - Atualização da Edge Function Principal (1 dia)
**Objetivo:** Integrar comunicação real com SEFAZ

**Tarefas:**
- [ ] Atualizar `emitir-nfce/index.ts`
- [ ] Substituir simulação por chamada real
- [ ] Adicionar tratamento de erros SEFAZ
- [ ] Salvar logs de transmissão
- [ ] Atualizar status da NFC-e conforme resposta

**Arquivo:** `supabase/functions/emitir-nfce/index.ts`

```typescript
// Fluxo de emissão:
// 1. Validar dados
// 2. Gerar XML
// 3. Assinar XML
// 4. Transmitir para SEFAZ
// 5. Processar resposta
// 6. Gerar QR Code
// 7. Atualizar banco de dados
// 8. Salvar logs
```

---

## 🗓️ FASE 3: Impressão e DANFE (3-4 dias)

### 3.1 - Template do DANFE NFC-e (2 dias)
**Objetivo:** Criar template HTML/CSS para impressão

**Tarefas:**
- [ ] Criar componente `DANFENFCe.tsx`
- [ ] Layout conforme especificação SEFAZ:
  - Logo e dados do emitente (topo)
  - QR Code (centralizado)
  - Itens da nota
  - Totais
  - Formas de pagamento
  - Informações adicionais
  - Chave de acesso (rodapé)
  - URL de consulta
- [ ] Suportar impressão térmica (80mm)
- [ ] Adicionar margem de segurança
- [ ] Testar em diferentes tamanhos de papel

**Arquivo:** `src/components/fiscal/DANFENFCe.tsx`

```typescript
interface DANFENFCeProps {
  nfce: NFCe;
  items: NFCeItem[];
  qrCodeDataURL: string;
}

export function DANFENFCe({ nfce, items, qrCodeDataURL }: DANFENFCeProps) {
  return (
    <div className="danfe-nfce" style={{ width: '80mm' }}>
      {/* Template conforme layout SEFAZ */}
    </div>
  );
}
```

**CSS para impressão:**
```css
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }
  
  .danfe-nfce {
    font-family: 'Courier New', monospace;
    font-size: 10pt;
    padding: 5mm;
  }
}
```

---

### 3.2 - Funcionalidade de Impressão (1 dia)
**Objetivo:** Implementar impressão direta e PDF

**Tarefas:**
- [ ] Criar hook `usePrintNFCe()`
- [ ] Implementar impressão via `window.print()`
- [ ] Implementar geração de PDF (biblioteca jsPDF)
- [ ] Adicionar opção de envio por email
- [ ] Adicionar opção de download
- [ ] Configurar impressora padrão

**Arquivo:** `src/hooks/usePrintNFCe.ts`

```typescript
export function usePrintNFCe() {
  const printNFCe = async (nfceId: string) => {
    // Buscar dados
    // Gerar HTML
    // Abrir janela de impressão
  };
  
  const downloadPDF = async (nfceId: string) => {
    // Gerar PDF
    // Download
  };
  
  const sendEmail = async (nfceId: string, email: string) => {
    // Enviar por email
  };
  
  return { printNFCe, downloadPDF, sendEmail };
}
```

---

### 3.3 - Impressão Automática no PDV (1 dia)
**Objetivo:** Integrar impressão com fluxo de venda

**Tarefas:**
- [ ] Adicionar opção "Emitir NFC-e" no PDV
- [ ] Imprimir automaticamente após autorização
- [ ] Adicionar configuração: imprimir via comprovante
- [ ] Suportar múltiplas impressoras
- [ ] Adicionar preview antes de imprimir

---

## 🗓️ FASE 4: Cancelamento e Inutilização (2-3 dias)

### 4.1 - Cancelamento de NFC-e (1 dia)
**Objetivo:** Implementar cancelamento conforme regras SEFAZ

**Tarefas:**
- [ ] Criar edge function `cancelar-nfce`
- [ ] Validar prazo de cancelamento (24h)
- [ ] Gerar XML de cancelamento
- [ ] Transmitir para SEFAZ
- [ ] Atualizar status no banco
- [ ] Salvar protocolo de cancelamento
- [ ] Criar dialog de cancelamento no frontend

**Arquivo:** `supabase/functions/cancelar-nfce/index.ts`

```typescript
interface CancelNFCeRequest {
  nfce_id: string;
  justificativa: string; // Mínimo 15 caracteres
}

// Validações:
// - Nota autorizada
// - Dentro do prazo de 24h
// - Justificativa com mínimo 15 caracteres
// - Não pode estar já cancelada
```

---

### 4.2 - Inutilização de Numeração (1 dia)
**Objetivo:** Inutilizar faixa de números pulados

**Tarefas:**
- [ ] Criar edge function `inutilizar-numeracao-nfce`
- [ ] Validar faixa (máximo 1000 números)
- [ ] Gerar XML de inutilização
- [ ] Transmitir para SEFAZ
- [ ] Salvar registro de inutilização
- [ ] Atualizar próximo número disponível

**Arquivo:** `supabase/functions/inutilizar-numeracao-nfce/index.ts`

---

### 4.3 - Interface de Gerenciamento (1 dia)
**Objetivo:** Telas para cancelamento e inutilização

**Tarefas:**
- [ ] Criar `NFCeCancelDialog.tsx`
- [ ] Criar `NFCeInutilizationDialog.tsx`
- [ ] Adicionar botões na listagem
- [ ] Validar permissões de usuário
- [ ] Exibir protocolo após operação

---

## 🗓️ FASE 5: Contingência Offline (3-4 dias)

### 5.1 - Modo Contingência (2 dias)
**Objetivo:** Emitir NFC-e offline quando SEFAZ indisponível

**Tarefas:**
- [ ] Criar tabela `nfce_contingency_queue`
- [ ] Implementar detecção de SEFAZ offline
- [ ] Salvar NFC-e na fila de contingência
- [ ] Gerar NFC-e em contingência (tipo de emissão 9)
- [ ] Adicionar indicador visual "EMITIDA EM CONTINGÊNCIA"
- [ ] Criar job para transmitir quando SEFAZ voltar

**Arquivo:** `supabase/migrations/[timestamp]_nfce_contingency.sql`

```sql
CREATE TABLE public.nfce_contingency_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfce_id UUID NOT NULL REFERENCES public.nfce(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  
  xml_generated TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, transmitted, failed
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

---

### 5.2 - Sincronização Automática (1 dia)
**Objetivo:** Transmitir NFC-e em contingência automaticamente

**Tarefas:**
- [ ] Criar edge function `sync-nfce-contingency`
- [ ] Configurar cron job (a cada 5 minutos)
- [ ] Buscar NFC-e pendentes na fila
- [ ] Tentar transmitir para SEFAZ
- [ ] Atualizar status conforme resultado
- [ ] Implementar backoff exponencial em caso de erro

**Arquivo:** `supabase/functions/sync-nfce-contingency/index.ts`

**Configuração do Cron:**
```sql
SELECT cron.schedule(
  'sync-nfce-contingency',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url:='https://wrdyffwjlylgxfbxbztf.supabase.co/functions/v1/sync-nfce-contingency',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb
  ) as request_id;
  $$
);
```

---

### 5.3 - Interface de Monitoramento (1 dia)
**Objetivo:** Painel para acompanhar contingência

**Tarefas:**
- [ ] Criar `NFCeContingencyPanel.tsx`
- [ ] Exibir status da SEFAZ (online/offline)
- [ ] Listar NFC-e em contingência
- [ ] Botão para forçar sincronização
- [ ] Exibir logs de tentativas

---

## 🗓️ FASE 6: Integração com PDV (2-3 dias)

### 6.1 - Emissão Automática no PDV (1 dia)
**Objetivo:** Emitir NFC-e automaticamente ao finalizar venda

**Tarefas:**
- [ ] Adicionar opção "Emitir NFC-e" no `PaymentDialog`
- [ ] Configurar emissão automática por padrão
- [ ] Passar dados da venda para emissão
- [ ] Vincular `order_id` e `caixa_sessao_id`
- [ ] Exibir sucesso/erro após pagamento
- [ ] Imprimir automaticamente se configurado

**Arquivo:** `src/components/pdv/PaymentDialog.tsx`

```typescript
// Adicionar checkbox:
<div className="flex items-center space-x-2">
  <Checkbox 
    id="emit-nfce" 
    checked={emitNFCe}
    onCheckedChange={setEmitNFCe}
  />
  <Label htmlFor="emit-nfce">Emitir NFC-e</Label>
</div>

// Após confirmação de pagamento:
if (emitNFCe) {
  await emitirNFCe({
    order_id: orderId,
    caixa_sessao_id: caixaSessaoId,
    items: cartItems,
    forma_pagamento: paymentMethod,
    // ...
  });
}
```

---

### 6.2 - Consulta Rápida no PDV (1 dia)
**Objetivo:** Visualizar NFC-e emitidas diretamente no PDV

**Tarefas:**
- [ ] Adicionar aba "NFC-e" no histórico do PDV
- [ ] Listar NFC-e da sessão de caixa atual
- [ ] Botão para reimprimir
- [ ] Botão para cancelar (se dentro do prazo)
- [ ] Exibir status de cada NFC-e

---

### 6.3 - Configurações PDV (1 dia)
**Objetivo:** Configurar comportamento da NFC-e no PDV

**Tarefas:**
- [ ] Adicionar configurações em `ERPSettings`:
  - Emitir NFC-e automaticamente (sim/não)
  - Imprimir automaticamente após emissão
  - Solicitar dados do cliente (sim/não/opcional)
  - Impressora padrão para NFC-e
  - Emitir em contingência se SEFAZ offline

---

## 🗓️ FASE 7: Relatórios e Consultas (2-3 dias)

### 7.1 - Relatórios Gerenciais (1 dia)
**Objetivo:** Relatórios de NFC-e emitidas

**Tarefas:**
- [ ] Criar página `NFCeReports.tsx`
- [ ] Relatório: NFC-e por período
- [ ] Relatório: NFC-e por status
- [ ] Relatório: NFC-e canceladas (com justificativa)
- [ ] Relatório: Totais por forma de pagamento
- [ ] Exportar para Excel/PDF
- [ ] Gráficos de análise

**Arquivo:** `src/pages/fiscal/NFCeReports.tsx`

---

### 7.2 - Consulta de NFC-e (1 dia)
**Objetivo:** Consultar status na SEFAZ

**Tarefas:**
- [ ] Criar edge function `consultar-nfce`
- [ ] Consultar por chave de acesso
- [ ] Exibir protocolo e situação
- [ ] Atualizar status local se diferente
- [ ] Criar dialog de consulta no frontend

**Arquivo:** `supabase/functions/consultar-nfce/index.ts`

---

### 7.3 - Auditoria Fiscal (1 dia)
**Objetivo:** Relatório para auditoria fiscal

**Tarefas:**
- [ ] Relatório de todas as operações
- [ ] Incluir XMLs assinados
- [ ] Incluir protocolos de autorização
- [ ] Incluir cancelamentos
- [ ] Incluir inutilizações
- [ ] Exportar ZIP com todos os XMLs

---

## 🗓️ FASE 8: Testes e Homologação (3-5 dias)

### 8.1 - Testes em Homologação (2 dias)
**Objetivo:** Testar em ambiente de homologação da SEFAZ

**Tarefas:**
- [ ] Configurar certificado de homologação
- [ ] Configurar CSC de homologação
- [ ] Emitir 10 NFC-e de teste
- [ ] Testar cancelamento
- [ ] Testar inutilização
- [ ] Testar contingência offline
- [ ] Validar layout do DANFE
- [ ] Validar QR Code

---

### 8.2 - Testes de Performance (1 dia)
**Objetivo:** Garantir performance adequada

**Tarefas:**
- [ ] Testar emissão simultânea (5 caixas)
- [ ] Medir tempo de resposta SEFAZ
- [ ] Testar impressão em diferentes impressoras
- [ ] Testar sincronização de contingência
- [ ] Otimizar queries lentas
- [ ] Adicionar índices necessários

---

### 8.3 - Testes de Segurança (1 dia)
**Objetivo:** Validar segurança dos dados

**Tarefas:**
- [ ] Testar RLS policies
- [ ] Validar criptografia do certificado
- [ ] Validar acesso aos logs
- [ ] Testar permissões de usuários
- [ ] Validar assinatura digital
- [ ] Teste de penetração básico

---

### 8.4 - Documentação (1 dia)
**Objetivo:** Documentar funcionalidades para usuários

**Tarefas:**
- [ ] Manual de configuração inicial
- [ ] Manual de uso do PDV com NFC-e
- [ ] Manual de cancelamento
- [ ] Manual de contingência
- [ ] FAQ com erros comuns
- [ ] Vídeos tutoriais

---

## 🗓️ FASE 9: Deploy e Monitoramento (2 dias)

### 9.1 - Deploy em Produção (1 dia)
**Objetivo:** Colocar em produção

**Tarefas:**
- [ ] Executar migrations de produção
- [ ] Deploy das edge functions
- [ ] Configurar cron jobs
- [ ] Configurar monitoramento (logs)
- [ ] Configurar alertas de erro
- [ ] Backup do banco de dados
- [ ] Testar em produção

---

### 9.2 - Monitoramento Contínuo (1 dia)
**Objetivo:** Monitorar funcionamento

**Tarefas:**
- [ ] Dashboard de monitoramento:
  - NFC-e emitidas hoje
  - Taxa de sucesso/erro
  - Tempo médio de emissão
  - Status da SEFAZ
  - Fila de contingência
- [ ] Alertas por email:
  - SEFAZ offline > 1h
  - Taxa de erro > 10%
  - Certificado próximo do vencimento
  - Fila de contingência > 100 NFC-e

---

## 📋 Checklist Final

### Funcionalidades Essenciais
- [ ] Emissão de NFC-e com SEFAZ
- [ ] Geração de QR Code
- [ ] Impressão do DANFE NFC-e
- [ ] Cancelamento dentro do prazo
- [ ] Inutilização de numeração
- [ ] Contingência offline
- [ ] Sincronização automática
- [ ] Integração com PDV
- [ ] Relatórios gerenciais

### Segurança
- [ ] Certificado digital configurado
- [ ] CSC configurado
- [ ] RLS habilitado em todas as tabelas
- [ ] Logs de auditoria
- [ ] Validações de permissão

### Performance
- [ ] Índices criados
- [ ] Queries otimizadas
- [ ] Cache implementado onde necessário
- [ ] Retry logic configurado

### Documentação
- [ ] Manual do usuário
- [ ] Documentação técnica
- [ ] FAQ
- [ ] Vídeos tutoriais

---

## ⏱️ Estimativa Total de Tempo

| Fase | Duração | Dias Úteis |
|------|---------|------------|
| Fase 1: Fundação | 3-4 dias | 3-4 |
| Fase 2: Integração SEFAZ | 5-7 dias | 5-7 |
| Fase 3: Impressão | 3-4 dias | 3-4 |
| Fase 4: Cancelamento | 2-3 dias | 2-3 |
| Fase 5: Contingência | 3-4 dias | 3-4 |
| Fase 6: Integração PDV | 2-3 dias | 2-3 |
| Fase 7: Relatórios | 2-3 dias | 2-3 |
| Fase 8: Testes | 3-5 dias | 3-5 |
| Fase 9: Deploy | 2 dias | 2 |
| **TOTAL** | **25-37 dias** | **~5-7 semanas** |

---

## 🎯 Próximos Passos Imediatos

### Dia 1 - Amanhã
1. ✅ Adicionar campos de configuração NFC-e na tabela `fiscal_config`
2. ✅ Criar função de validação `validate_nfce_emission()`
3. ✅ Criar tabela `nfce_transmission_logs`

### Dia 2
1. Iniciar edge function `sefaz-nfce-transmit`
2. Implementar geração de XML básica
3. Implementar assinatura digital

### Dia 3
1. Completar comunicação SOAP com SEFAZ
2. Implementar tratamento de erros
3. Testes iniciais em homologação

---

## 📞 Suporte e Recursos

### Documentação Oficial
- Portal da NFC-e: https://www.nfce.fazenda.sp.gov.br/
- Manual de Orientação: https://www.nfe.fazenda.gov.br/
- Schemas XSD: https://www.nfe.fazenda.gov.br/

### Bibliotecas Úteis
- Assinatura XML: node-forge, crypto
- Geração de QR Code: qrcode
- Geração de PDF: jsPDF, pdfmake
- Parser XML: fast-xml-parser

---

## ✅ Status de Implementação

**Última Atualização:** 22/11/2024

- ✅ Estrutura básica criada
- 🔄 Integração SEFAZ em andamento
- ⏳ Demais fases pendentes

---

## 📝 Notas Importantes

1. **Certificado Digital:** Essencial ter um certificado A1 válido antes de iniciar testes com SEFAZ
2. **CSC:** Obter o CSC junto à SEFAZ do estado antes de emitir em produção
3. **Homologação:** Sempre testar em ambiente de homologação antes de produção
4. **Contingência:** Planejar bem a contingência para não perder vendas se SEFAZ cair
5. **Backup:** Manter backup regular dos XMLs autorizados (obrigação fiscal por 5 anos)

---

**Dúvidas?** Entre em contato com a equipe de desenvolvimento.
