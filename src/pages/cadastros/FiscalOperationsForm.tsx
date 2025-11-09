import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFiscalOperations, FiscalOperation, CFOPCode } from '@/hooks/useFiscalOperations';
import { useTaxGroups } from '@/hooks/useTaxGroups';
import { toast } from 'sonner';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function FiscalOperationsForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { fiscalOperations, createFiscalOperation, updateFiscalOperation } = useFiscalOperations();
  const { taxGroups } = useTaxGroups();
  const [loading, setLoading] = useState(false);
  const [currentCFOP, setCurrentCFOP] = useState({ code: '', description: '' });
  
  const [formData, setFormData] = useState<Partial<FiscalOperation>>({
    operation_name: '',
    tax_group_id: '',
    destination_state: '',
    pis_situation: '07 - Operação Isenta da Contribuição',
    cofins_situation: '07 - Operação Isenta da Contribuição',
    additional_info: '',
    icms_situation: '60 - ICMS Cobrado Anteriormente por S',
    sum_ipi_on_base: false,
    show_icms_st_on_invoice: false,
    interstate_icms_rate: 0,
    internal_icms_rate: 0,
    fcp_rate: 0,
    calculate_base_inside: false,
    effective_icms_bc_reduction: 0,
    effective_icms_rate: 0,
    ipi_situation_suframa: '',
    ipi_situation_general: '',
    ipi_rate_suframa: 0,
    ipi_rate_general: 0,
    ex_tipi_suframa: '',
    ex_tipi_general: '',
    ipi_class_suframa: '',
    ipi_class_general: '',
    cfop_codes: [],
    fiscal_benefit: 'Configurado no Produto',
  });

  useEffect(() => {
    if (id && id !== 'new') {
      const operation = fiscalOperations.find((op) => op.id === id);
      if (operation) {
        setFormData(operation);
      }
    }
  }, [id, fiscalOperations]);

  const handleSave = async () => {
    if (!formData.operation_name || !formData.tax_group_id || !formData.destination_state) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      if (id && id !== 'new') {
        await updateFiscalOperation(id, formData);
      } else {
        await createFiscalOperation(formData);
      }
      navigate('/cadastros/fiscal-operations');
    } catch (error) {
      console.error('Erro ao salvar operação fiscal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCFOP = () => {
    if (!currentCFOP.code) {
      toast.error('Informe o código CFOP');
      return;
    }
    
    const cfopCodes = (formData.cfop_codes || []) as CFOPCode[];
    setFormData({
      ...formData,
      cfop_codes: [...cfopCodes, currentCFOP],
    });
    setCurrentCFOP({ code: '', description: '' });
  };

  const handleRemoveCFOP = (index: number) => {
    const cfopCodes = (formData.cfop_codes || []) as CFOPCode[];
    setFormData({
      ...formData,
      cfop_codes: cfopCodes.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {id && id !== 'new' ? 'Editar Operação Fiscal' : 'Nova Operação Fiscal'}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/cadastros/fiscal-operations')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="base" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="base">Base</TabsTrigger>
              <TabsTrigger value="icms">ICMS</TabsTrigger>
              <TabsTrigger value="ipi">IPI (Geral/SUFRAMA)</TabsTrigger>
              <TabsTrigger value="cfop">CFOP</TabsTrigger>
              <TabsTrigger value="other">Demais Classificações Fiscais</TabsTrigger>
            </TabsList>

            <TabsContent value="base" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="operation_name">Operação *</Label>
                  <Input
                    id="operation_name"
                    value={formData.operation_name}
                    onChange={(e) => setFormData({ ...formData, operation_name: e.target.value })}
                    placeholder="Ex: Venda, Transferência"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_group_id">Grupo Tributário *</Label>
                  <Select
                    value={formData.tax_group_id}
                    onValueChange={(value) => setFormData({ ...formData, tax_group_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxGroups.filter((g) => g.is_active).map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination_state">Destino - Estado *</Label>
                  <Select
                    value={formData.destination_state}
                    onValueChange={(value) => setFormData({ ...formData, destination_state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pis_situation">Situação do PIS *</Label>
                  <Select
                    value={formData.pis_situation}
                    onValueChange={(value) => setFormData({ ...formData, pis_situation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="07 - Operação Isenta da Contribuição">
                        07 - Operação Isenta da Contribuição
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cofins_situation">Situação do COFINS *</Label>
                  <Select
                    value={formData.cofins_situation}
                    onValueChange={(value) => setFormData({ ...formData, cofins_situation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="07 - Operação Isenta da Contribuição">
                        07 - Operação Isenta da Contribuição
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_info">Informações Complementares</Label>
                <Textarea
                  id="additional_info"
                  value={formData.additional_info || ''}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  rows={3}
                  placeholder="Informações adicionais sobre a operação fiscal"
                />
              </div>
            </TabsContent>

            <TabsContent value="icms" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ICMS</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="icms_situation">Situação do ICMS</Label>
                    <Select
                      value={formData.icms_situation || ''}
                      onValueChange={(value) => setFormData({ ...formData, icms_situation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60 - ICMS Cobrado Anteriormente por S">
                          60 - ICMS Cobrado Anteriormente por S
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sum_ipi_on_base">Somar IPI na Base</Label>
                    <Switch
                      id="sum_ipi_on_base"
                      checked={formData.sum_ipi_on_base}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, sum_ipi_on_base: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_icms_st_on_invoice">Exibir ICMS ST na Nota</Label>
                    <Switch
                      id="show_icms_st_on_invoice"
                      checked={formData.show_icms_st_on_invoice}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, show_icms_st_on_invoice: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ICMS - UF Destino</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="interstate_icms_rate">Alíquota Interestadual ICMS (%)</Label>
                    <Input
                      id="interstate_icms_rate"
                      type="number"
                      step="0.01"
                      value={formData.interstate_icms_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, interstate_icms_rate: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internal_icms_rate">Alíquota Interna ICMS UF Destino (%)</Label>
                    <Input
                      id="internal_icms_rate"
                      type="number"
                      step="0.01"
                      value={formData.internal_icms_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, internal_icms_rate: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fcp_rate">Alíquota FCP (%)</Label>
                    <Input
                      id="fcp_rate"
                      type="number"
                      step="0.01"
                      value={formData.fcp_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, fcp_rate: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="calculate_base_inside">Cálculo Base Por Dentro</Label>
                  <Switch
                    id="calculate_base_inside"
                    checked={formData.calculate_base_inside}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, calculate_base_inside: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ICMS Efetivo</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="effective_icms_bc_reduction">Redução BC do ICMS Efetivo (%)</Label>
                    <Input
                      id="effective_icms_bc_reduction"
                      type="number"
                      step="0.01"
                      value={formData.effective_icms_bc_reduction}
                      onChange={(e) =>
                        setFormData({ ...formData, effective_icms_bc_reduction: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="effective_icms_rate">Alíquota do ICMS Efetivo (%)</Label>
                    <Input
                      id="effective_icms_rate"
                      type="number"
                      step="0.01"
                      value={formData.effective_icms_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, effective_icms_rate: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ipi" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">IPI para SUFRAMA</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="ipi_situation_suframa">Situação Tributária IPI</Label>
                    <Input
                      id="ipi_situation_suframa"
                      value={formData.ipi_situation_suframa || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, ipi_situation_suframa: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipi_rate_suframa">Alíquota IPI (%)</Label>
                    <Input
                      id="ipi_rate_suframa"
                      type="number"
                      step="0.01"
                      value={formData.ipi_rate_suframa}
                      onChange={(e) =>
                        setFormData({ ...formData, ipi_rate_suframa: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex_tipi_suframa">EX TIPI</Label>
                    <Input
                      id="ex_tipi_suframa"
                      value={formData.ex_tipi_suframa || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, ex_tipi_suframa: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipi_class_suframa">Classe Enquadramento IPI</Label>
                    <Input
                      id="ipi_class_suframa"
                      value={formData.ipi_class_suframa || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, ipi_class_suframa: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">IPI</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="ipi_situation_general">Situação Tributária IPI</Label>
                    <Input
                      id="ipi_situation_general"
                      value={formData.ipi_situation_general || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, ipi_situation_general: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipi_rate_general">Alíquota IPI (%)</Label>
                    <Input
                      id="ipi_rate_general"
                      type="number"
                      step="0.01"
                      value={formData.ipi_rate_general}
                      onChange={(e) =>
                        setFormData({ ...formData, ipi_rate_general: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex_tipi_general">EX TIPI</Label>
                    <Input
                      id="ex_tipi_general"
                      value={formData.ex_tipi_general || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, ex_tipi_general: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ipi_class_general">Classe Enquadramento IPI</Label>
                    <Input
                      id="ipi_class_general"
                      value={formData.ipi_class_general || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, ipi_class_general: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cfop" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">CFOP</h3>
                <div className="flex gap-4">
                  <Input
                    placeholder="Código CFOP"
                    value={currentCFOP.code}
                    onChange={(e) => setCurrentCFOP({ ...currentCFOP, code: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Descrição"
                    value={currentCFOP.description}
                    onChange={(e) => setCurrentCFOP({ ...currentCFOP, description: e.target.value })}
                    className="flex-[2]"
                  />
                  <Button onClick={handleAddCFOP}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {formData.cfop_codes && (formData.cfop_codes as CFOPCode[]).length > 0 && (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Código CFOP</th>
                          <th className="text-left p-3 font-medium">Descrição CFOP</th>
                          <th className="w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.cfop_codes as CFOPCode[]).map((cfop, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{cfop.code}</td>
                            <td className="p-3">{cfop.description}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveCFOP(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Benefício Fiscal</h3>
                <div className="space-y-2">
                  <Select
                    value={formData.fiscal_benefit || ''}
                    onValueChange={(value) => setFormData({ ...formData, fiscal_benefit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Configurado no Produto">
                        Configurado no Produto
                      </SelectItem>
                      <SelectItem value="Configurado na Operação Fiscal">
                        Configurado na Operação Fiscal
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
