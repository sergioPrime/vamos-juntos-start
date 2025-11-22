# 🚀 FASE 2: Integração com SEFAZ - Status e Próximos Passos

## ✅ Concluído

### Estrutura Base Criada
- [x] `_shared/nfce-xml-generator.ts` - Geração de XML NFC-e conforme layout 4.00
- [x] `_shared/nfce-qrcode-generator.ts` - Geração de URL e QR Code
- [x] `_shared/nfce-sefaz-urls.ts` - Endpoints SEFAZ por UF e ambiente
- [x] Funções para cálculo de chave de acesso (44 dígitos)
- [x] Funções para formatar XML conforme especificação
- [x] Tabela de logs de transmissão criada
- [x] Hook de validação `useNFCeValidation`
- [x] Componente visual `NFCeConfigStatus`

---

## 🔄 Próximos Passos (Fase 2 Continuação)

### 1. Assinatura Digital XML ⏳
**Objetivo:** Assinar o XML com certificado A1

**O que fazer:**
```typescript
// Criar: supabase/functions/_shared/xml-signer.ts

// Funcionalidades:
- Ler certificado PFX do banco (descriptografar)
- Extrair chave privada
- Calcular digest (SHA-256)
- Assinar XML com RSA-SHA256
- Inserir tag <Signature> no XML
```

**Bibliotecas necessárias:**
- Para Deno: `https://deno.land/std/crypto/mod.ts`
- Ou: `https://esm.sh/node-forge` (mais completo)

**Desafio:** Certificado A1 usa PKCS#12, precisa descriptografar e extrair chave privada

---

### 2. Comunicação SOAP com SEFAZ ⏳
**Objetivo:** Enviar XML assinado para SEFAZ e processar resposta

**O que fazer:**
```typescript
// Criar: supabase/functions/_shared/sefaz-client.ts

interface TransmitResult {
  success: boolean;
  status: string;
  protocol?: string;
  message: string;
  rawXML: string;
}

async function transmitNFCe(
  xml: string,
  uf: string,
  ambiente: 'producao' | 'homologacao'
): Promise<TransmitResult>
```

**Etapas:**
1. Buscar endpoint correto (usar `getSEFAZEndpoints()`)
2. Montar envelope SOAP (usar `buildSOAPEnvelope()`)
3. Enviar via HTTP POST
4. Parse da resposta SOAP
5. Interpretar código de status
6. Retornar resultado estruturado

---

### 3. Atualizar Edge Function Principal ⏳
**Objetivo:** Integrar todas as peças na `emitir-nfce`

**Fluxo completo:**
```typescript
// supabase/functions/emitir-nfce/index.ts

1. Validar pré-requisitos (validate_nfce_emission)
2. Buscar configuração fiscal
3. Gerar XML (generateNFCeXML)
4. Calcular chave de acesso (calculateAccessKey)
5. Assinar XML (signXML)
6. Transmitir para SEFAZ (transmitNFCe)
7. Processar resposta:
   - Se autorizada: gerar QR Code, atualizar banco
   - Se rejeitada: salvar erro, notificar usuário
   - Se processando: implementar polling
8. Salvar log de transmissão
9. Retornar resultado
```

---

### 4. Implementar Retry Logic ⏳
**Objetivo:** Tentar novamente em caso de falha temporária

**Códigos que permitem retry:**
- 105 (Lote em processamento) - aguardar e consultar novamente
- 108/109 (Serviço paralisado) - tentar em contingência
- Timeout de rede - retry com backoff exponencial

**Implementação:**
```typescript
async function transmitWithRetry(
  xml: string,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<TransmitResult> {
  // Implementar backoff exponencial
  // Delay: 1s, 2s, 4s, etc
}
```

---

## 🧪 Testes Necessários

### Ambiente de Homologação
Antes de implementar a integração real, você precisará:

1. **Certificado Digital A1:**
   - Obter certificado de teste da SEFAZ
   - Ou usar certificado próprio em homologação

2. **CSC de Homologação:**
   - Obter na SEFAZ do seu estado
   - Configurar no sistema

3. **Casos de teste:**
   - [ ] Emissão básica (1 item, sem destinatário)
   - [ ] Emissão com destinatário CPF
   - [ ] Emissão com destinatário CNPJ
   - [ ] Emissão com múltiplos itens
   - [ ] Emissão com desconto
   - [ ] Várias formas de pagamento
   - [ ] Consulta de status
   - [ ] Cancelamento (dentro de 24h)
   - [ ] Inutilização de numeração

---

## ⚠️ Pontos de Atenção

### Certificado Digital
O maior desafio é a assinatura digital do XML:
- Certificado A1 é um arquivo PFX protegido por senha
- Precisa descriptografar, extrair chave privada
- Assinar XML seguindo padrão XML-DSig
- Calcular digest SHA-256
- Inserir tag `<Signature>` no local correto

**Opções:**
1. **Usar biblioteca node-forge** (recomendado)
   - Suporta PKCS#12
   - Funciona no Deno
   - Mais testado

2. **Usar Web Crypto API nativa**
   - Menos dependências
   - Mais complexo
   - Pode ter limitações

### Performance
- Assina tura XML pode levar 200-500ms
- Comunicação SEFAZ pode levar 1-3 segundos
- Total: 2-4 segundos por NFC-e

### Limitações SEFAZ
- Máximo 50 NFC-e por lote
- Timeout de 30 segundos
- Rate limit por CNPJ

---

## 📚 Documentação de Referência

### Documentos Oficiais
1. **Manual de Integração NFC-e v4.00**
   - Layout do XML
   - Regras de validação
   - Códigos de erro

2. **NT 2016.002 - QR Code**
   - Especificação do QR Code
   - Cálculo do hash

3. **Manual de Orientação do Contribuinte**
   - Regras de negócio
   - Prazos e obrigações

### Links Úteis
- Portal Nacional: https://www.nfe.fazenda.gov.br/
- Schemas XSD: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w=
- Códigos de Status: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=lWvLKd8WIfQ=

---

## 🎯 Decisão Necessária

Para continuar com a integração SEFAZ **REAL**, você precisa decidir:

### Opção A: Implementação Real Completa (Recomendado para produção)
- ✅ Integração completa com SEFAZ
- ✅ Assinatura digital real
- ✅ XMLs válidos juridicamente
- ⏱️ Complexidade alta
- 💰 Requer certificado A1 válido
- ⏰ 5-7 dias de desenvolvimento

**Escolher se:** Você vai usar em produção em breve

### Opção B: Simulação Aprimorada (Recomendado para MVP)
- ✅ Funcionalidades completas no frontend
- ✅ Fluxo de trabalho completo
- ✅ Geração de XMLs "válidos" (sem assinatura)
- ✅ Desenvolvimento rápido
- ⏱️ 1-2 dias
- 🔄 Fácil migrar para real depois

**Escolher se:** Você quer validar o produto primeiro

---

## 🤔 Qual caminho seguir?

**Pergunta:** Você prefere:

1. **Implementar integração real agora** (precisa de certificado A1)?
2. **Continuar com simulação** e focar em outras funcionalidades (impressão, contingência, PDV)?
3. **Implementar estrutura preparada** para integração real, mas mantendo simulação por enquanto?

Informe sua escolha para prosseguirmos! 🚀
