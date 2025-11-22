# Guia Rápido - Sistema NFC-e

## 🚀 Início Rápido

### 1. Acesso ao Sistema
- Acesse: `/fiscal/nfce`
- Navegação: Menu Lateral → Fiscal → NFCe - Modelo 65

### 2. Primeira Configuração

#### Passo 1: Certificado Digital
```
Settings → Configurações ERP → Fiscal
- Upload do certificado .pfx
- Senha do certificado
- Validar validade
```

#### Passo 2: CSC (Código de Segurança)
```
Settings → Configurações ERP → Fiscal
- CSC de Homologação
- ID do CSC Homologação
- CSC de Produção
- ID do CSC Produção
```

#### Passo 3: Numeração
```
Settings → Configurações ERP → Fiscal
- Série NFC-e (geralmente 1)
- Número inicial (1)
- Ambiente (Homologação/Produção)
```

---

## 📝 Emitindo sua Primeira NFC-e

### Via PDV
1. Adicione produtos ao carrinho
2. Finalize a venda
3. Selecione forma de pagamento
4. Informe dados do cliente (opcional)
5. Clique em "Emitir NFC-e"
6. Aguarde autorização (3-5 segundos)
7. Imprima o DANFE

### Via Sistema
1. Acesse `/fiscal/nfce`
2. Tab "Listagem"
3. Veja suas NFC-e emitidas
4. Status em tempo real

---

## ⚠️ Modo Contingência

### Quando Usar?
- Problemas de internet
- SEFAZ fora do ar
- Certificado vencido (temporário)

### Como Ativar?
1. Acesse tab "Contingência"
2. Clique em "Ativar Contingência"
3. Informe o motivo
4. Confirme

### O que Acontece?
- ✅ Vendas continuam normalmente
- 📦 NFC-e ficam em fila
- 🔄 Transmissão automática ao normalizar
- 📊 Você acompanha a fila

### Como Desativar?
1. Tab "Contingência"
2. Clique em "Desativar Contingência"
3. Sistema transmite a fila automaticamente

---

## 🔍 Consultando NFC-e

### Buscar NFC-e
- Por número
- Por chave de acesso
- Por nome do cliente
- Filtro de período

### Ver Detalhes
1. Clique no ícone de olho 👁️
2. Veja todos os dados
3. Valores e impostos
4. Status atual

### Atualizar Status
1. Clique no ícone de atualização 🔄
2. Sistema consulta SEFAZ
3. Status atualizado automaticamente

---

## ❌ Cancelando NFC-e

### Requisitos
- ✅ NFC-e autorizada
- ✅ Prazo: até 24h após emissão
- ✅ Justificativa (mínimo 15 caracteres)

### Como Cancelar?
1. Localize a NFC-e
2. Clique em "Cancelar"
3. Informe justificativa clara
4. Confirme cancelamento
5. Aguarde confirmação SEFAZ

### Motivos Comuns
- "Erro no valor do produto"
- "Cliente desistiu da compra"
- "Emissão duplicada"
- "Dados incorretos do destinatário"

---

## 📊 Relatórios

### Acessar Relatórios
1. Tab "Relatórios"
2. Defina período
3. Escolha tipo de relatório
4. Visualize métricas

### Tipos de Relatório
- **Resumo**: Visão geral e totalizadores
- **Detalhado**: Lista completa de NFC-e
- **Fiscal**: Dados para contabilidade

### Métricas Disponíveis
- 📈 Total de NFC-e
- ✅ Autorizadas
- ❌ Canceladas  
- 🚫 Rejeitadas
- 💰 Valor total
- 📊 Ticket médio

### Exportar Dados
1. Configure filtros
2. Clique em "Exportar (CSV)"
3. Abra no Excel/Google Sheets

---

## 🚨 Solução de Problemas

### NFC-e Rejeitada

**Erro: "Certificado inválido"**
```
Solução:
1. Verifique validade do certificado
2. Reinstale se necessário
3. Confirme senha correta
```

**Erro: "CSC inválido"**
```
Solução:
1. Acesse portal SEFAZ
2. Confirme CSC cadastrado
3. Atualize no sistema
```

**Erro: "Produto sem NCM"**
```
Solução:
1. Acesse cadastro de produtos
2. Inclua NCM válido
3. Salve alterações
```

**Erro: "Numeração inválida"**
```
Solução:
1. Consulte última NFC-e na SEFAZ
2. Ajuste numeração no sistema
3. Tente novamente
```

### Contingência Não Transmite

**Problema: Fila parada**
```
Solução:
1. Verifique conexão internet
2. Teste acesso SEFAZ
3. Desative e reative contingência
4. Transmita manualmente se necessário
```

### DANFE Não Imprime

**Problema: PDF não abre**
```
Solução:
1. Verifique se NFC-e foi autorizada
2. Aguarde processamento (até 1 min)
3. Tente recarregar a página
4. Use botão de download manual
```

---

## 💡 Dicas e Boas Práticas

### Antes de Emitir
- ✅ Verifique dados do cliente
- ✅ Confira valores e impostos
- ✅ Valide produtos cadastrados
- ✅ Teste em homologação primeiro

### Durante a Operação
- 📊 Monitore relatórios diariamente
- 🔄 Mantenha backup dos XMLs
- ⚠️ Fique atento a rejeições
- 🕐 Cancele dentro do prazo

### Manutenção
- 📅 Verifique validade do certificado
- 🔐 Mantenha senhas seguras
- 💾 Faça backup regular
- 📈 Acompanhe indicadores

---

## 📞 Precisa de Ajuda?

### Recursos
- 📚 Documentação completa: `SISTEMA_NFCE_COMPLETO.md`
- 🎥 Vídeos tutoriais: Em breve
- 💬 Chat de suporte: No sistema

### Contato
- **Email**: suporte@primegestor.com.br
- **Telefone**: (11) 0000-0000
- **Horário**: Seg-Sex, 8h-18h

---

## 🎯 Checklist Diário

### Manhã
- [ ] Verificar contingência desativada
- [ ] Conferir NFC-e rejeitadas do dia anterior
- [ ] Processar fila de contingência (se houver)

### Durante o Dia
- [ ] Monitorar emissões em tempo real
- [ ] Corrigir rejeições imediatamente
- [ ] Atender solicitações de cancelamento

### Fim do Dia
- [ ] Gerar relatório do dia
- [ ] Conferir totalizadores
- [ ] Fazer backup dos XMLs
- [ ] Verificar alertas do sistema

---

**Última atualização**: 2024
**Versão**: 1.0.0
