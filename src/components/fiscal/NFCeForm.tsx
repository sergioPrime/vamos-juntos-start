import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNFCe, NFCeItem } from '@/hooks/useNFCe';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function NFCeForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { emitirNFCe, loading } = useNFCe();

  const [destinatario, setDestinatario] = useState({
    tipo: 'person',
    nome: '',
    documento: '',
    email: '',
    telefone: '',
  });

  const [items, setItems] = useState<NFCeItem[]>([
    {
      codigo_produto: '',
      descricao: '',
      unidade: 'UN',
      quantidade: 1,
      valor_unitario: 0,
      cfop: '5102',
      icms_cst: '00',
      icms_aliquota: 18,
      pis_cst: '01',
      pis_aliquota: 1.65,
      cofins_cst: '01',
      cofins_aliquota: 7.6,
    },
  ]);

  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [troco, setTroco] = useState(0);
  const [informacoesComplementares, setInformacoesComplementares] = useState('');

  const addItem = () => {
    setItems([
      ...items,
      {
        codigo_produto: '',
        descricao: '',
        unidade: 'UN',
        quantidade: 1,
        valor_unitario: 0,
        cfop: '5102',
        icms_cst: '00',
        icms_aliquota: 18,
        pis_cst: '01',
        pis_aliquota: 1.65,
        cofins_cst: '01',
        cofins_aliquota: 7.6,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof NFCeItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (items.some((item) => !item.codigo_produto || !item.descricao)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos dos itens.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await emitirNFCe({
        destinatario: destinatario.nome ? destinatario : undefined,
        items,
        forma_pagamento: formaPagamento,
        troco,
        informacoes_complementares: informacoesComplementares,
      });

      navigate('/fiscal/nfce');
    } catch (error) {
      // Error já tratado no hook
    }
  };

  const calcularTotal = () => {
    return items.reduce((acc, item) => {
      return acc + item.quantidade * item.valor_unitario;
    }, 0);
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/fiscal/nfce')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Emitir NFC-e</h1>
            <p className="text-muted-foreground">Nota Fiscal de Consumidor Eletrônica</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Emitindo...' : 'Emitir NFC-e'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destinatário (Opcional) */}
        <Card>
          <CardHeader>
            <CardTitle>Destinatário (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={destinatario.tipo} onValueChange={(value) => setDestinatario({ ...destinatario, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Pessoa Física</SelectItem>
                    <SelectItem value="company">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome/Razão Social</Label>
                <Input
                  value={destinatario.nome}
                  onChange={(e) => setDestinatario({ ...destinatario, nome: e.target.value })}
                  placeholder="Nome do consumidor"
                />
              </div>

              <div className="space-y-2">
                <Label>{destinatario.tipo === 'person' ? 'CPF' : 'CNPJ'}</Label>
                <Input
                  value={destinatario.documento}
                  onChange={(e) => setDestinatario({ ...destinatario, documento: e.target.value })}
                  placeholder={destinatario.tipo === 'person' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={destinatario.email}
                  onChange={(e) => setDestinatario({ ...destinatario, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={destinatario.telefone}
                  onChange={(e) => setDestinatario({ ...destinatario, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Itens da NFC-e</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Item {index + 1}</h3>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Código do Produto *</Label>
                    <Input
                      value={item.codigo_produto}
                      onChange={(e) => updateItem(index, 'codigo_produto', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Descrição *</Label>
                    <Input
                      value={item.descricao}
                      onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Input
                      value={item.unidade}
                      onChange={(e) => updateItem(index, 'unidade', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Unitário *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.valor_unitario}
                      onChange={(e) => updateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CFOP</Label>
                    <Input
                      value={item.cfop}
                      onChange={(e) => updateItem(index, 'cfop', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ICMS CST</Label>
                    <Input
                      value={item.icms_cst}
                      onChange={(e) => updateItem(index, 'icms_cst', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ICMS Alíquota (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.icms_aliquota || 0}
                      onChange={(e) => updateItem(index, 'icms_aliquota', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Valor Total: R$ {(item.quantidade * item.valor_unitario).toFixed(2)}
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="vale_alimentacao">Vale Alimentação</SelectItem>
                    <SelectItem value="vale_refeicao">Vale Refeição</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formaPagamento === 'dinheiro' && (
                <div className="space-y-2">
                  <Label>Troco</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={troco}
                    onChange={(e) => setTroco(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Informações Complementares</Label>
              <Textarea
                value={informacoesComplementares}
                onChange={(e) => setInformacoesComplementares(e.target.value)}
                placeholder="Informações adicionais para o consumidor"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Totais */}
        <Card>
          <CardHeader>
            <CardTitle>Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Total: R$ {calcularTotal().toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
