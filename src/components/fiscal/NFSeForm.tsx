import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNFSe } from '@/hooks/useNFSe';

interface NFSeFormProps {
  fiscalConfigs: Array<{
    id: string;
    razao_social: string;
    cnpj: string;
  }>;
}

export function NFSeForm({ fiscalConfigs }: NFSeFormProps) {
  const navigate = useNavigate();
  const { emitirNFSe } = useNFSe();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fiscalConfigId: '',
    tomador: {
      nome: '',
      cpfCnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
    },
    servico: {
      codigoServico: '',
      discriminacao: '',
      codigoTributacaoMunicipio: '',
    },
    valores: {
      valorServicos: '',
      valorDeducoes: '0',
      aliquotaIss: '5.0',
    },
    retencoes: {
      issRetido: false,
      pisRetido: false,
      cofinsRetido: false,
      inssRetido: false,
      irRetido: false,
      csllRetido: false,
    },
    dataCompetencia: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fiscalConfigId || !formData.tomador.nome || !formData.tomador.cpfCnpj) {
      return;
    }

    setLoading(true);
    try {
      await emitirNFSe({
        fiscalConfigId: formData.fiscalConfigId,
        tomador: formData.tomador,
        servico: formData.servico,
        valores: {
          valorServicos: parseFloat(formData.valores.valorServicos),
          valorDeducoes: parseFloat(formData.valores.valorDeducoes),
          aliquotaIss: parseFloat(formData.valores.aliquotaIss),
        },
        retencoes: formData.retencoes,
        dataCompetencia: formData.dataCompetencia,
      });
      
      navigate('/fiscal/nfse');
    } catch (error) {
      console.error('Erro ao emitir NFS-e:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/fiscal/nfse')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Emitindo...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Emitir NFS-e
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Prestador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fiscalConfig">Empresa Prestadora *</Label>
              <Select
                value={formData.fiscalConfigId}
                onValueChange={(value) => setFormData({ ...formData, fiscalConfigId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {fiscalConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.razao_social} - CNPJ: {config.cnpj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Tomador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tomador.nome">Nome/Razão Social *</Label>
              <Input
                id="tomador.nome"
                value={formData.tomador.nome}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, nome: e.target.value }
                })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomador.cpfCnpj">CPF/CNPJ *</Label>
              <Input
                id="tomador.cpfCnpj"
                value={formData.tomador.cpfCnpj}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, cpfCnpj: e.target.value }
                })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomador.email">Email</Label>
              <Input
                id="tomador.email"
                type="email"
                value={formData.tomador.email}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, email: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomador.telefone">Telefone</Label>
              <Input
                id="tomador.telefone"
                value={formData.tomador.telefone}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, telefone: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomador.cep">CEP</Label>
              <Input
                id="tomador.cep"
                value={formData.tomador.cep}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, cep: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tomador.endereco">Endereço</Label>
              <Input
                id="tomador.endereco"
                value={formData.tomador.endereco}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, endereco: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomador.numero">Número</Label>
              <Input
                id="tomador.numero"
                value={formData.tomador.numero}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, numero: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomador.bairro">Bairro</Label>
              <Input
                id="tomador.bairro"
                value={formData.tomador.bairro}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, bairro: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomador.cidade">Cidade</Label>
              <Input
                id="tomador.cidade"
                value={formData.tomador.cidade}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, cidade: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tomador.uf">UF</Label>
              <Input
                id="tomador.uf"
                maxLength={2}
                value={formData.tomador.uf}
                onChange={(e) => setFormData({
                  ...formData,
                  tomador: { ...formData.tomador, uf: e.target.value.toUpperCase() }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="servico.codigoServico">Código do Serviço *</Label>
              <Input
                id="servico.codigoServico"
                placeholder="Ex: 01.01"
                value={formData.servico.codigoServico}
                onChange={(e) => setFormData({
                  ...formData,
                  servico: { ...formData.servico, codigoServico: e.target.value }
                })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="servico.codigoTributacaoMunicipio">Cód. Tributação Município</Label>
              <Input
                id="servico.codigoTributacaoMunicipio"
                value={formData.servico.codigoTributacaoMunicipio}
                onChange={(e) => setFormData({
                  ...formData,
                  servico: { ...formData.servico, codigoTributacaoMunicipio: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="servico.discriminacao">Discriminação do Serviço *</Label>
              <Textarea
                id="servico.discriminacao"
                rows={4}
                value={formData.servico.discriminacao}
                onChange={(e) => setFormData({
                  ...formData,
                  servico: { ...formData.servico, discriminacao: e.target.value }
                })}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valores e Tributos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="valores.valorServicos">Valor dos Serviços *</Label>
              <Input
                id="valores.valorServicos"
                type="number"
                step="0.01"
                min="0"
                value={formData.valores.valorServicos}
                onChange={(e) => setFormData({
                  ...formData,
                  valores: { ...formData.valores, valorServicos: e.target.value }
                })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valores.valorDeducoes">Valor das Deduções</Label>
              <Input
                id="valores.valorDeducoes"
                type="number"
                step="0.01"
                min="0"
                value={formData.valores.valorDeducoes}
                onChange={(e) => setFormData({
                  ...formData,
                  valores: { ...formData.valores, valorDeducoes: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valores.aliquotaIss">Alíquota ISS (%)</Label>
              <Input
                id="valores.aliquotaIss"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.valores.aliquotaIss}
                onChange={(e) => setFormData({
                  ...formData,
                  valores: { ...formData.valores, aliquotaIss: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataCompetencia">Data de Competência</Label>
              <Input
                id="dataCompetencia"
                type="date"
                value={formData.dataCompetencia}
                onChange={(e) => setFormData({ ...formData, dataCompetencia: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6">
            <Label className="mb-3 block">Retenções</Label>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retencoes.issRetido"
                  checked={formData.retencoes.issRetido}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    retencoes: { ...formData.retencoes, issRetido: checked as boolean }
                  })}
                />
                <Label htmlFor="retencoes.issRetido" className="cursor-pointer">ISS Retido</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retencoes.pisRetido"
                  checked={formData.retencoes.pisRetido}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    retencoes: { ...formData.retencoes, pisRetido: checked as boolean }
                  })}
                />
                <Label htmlFor="retencoes.pisRetido" className="cursor-pointer">PIS Retido</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retencoes.cofinsRetido"
                  checked={formData.retencoes.cofinsRetido}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    retencoes: { ...formData.retencoes, cofinsRetido: checked as boolean }
                  })}
                />
                <Label htmlFor="retencoes.cofinsRetido" className="cursor-pointer">COFINS Retido</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retencoes.inssRetido"
                  checked={formData.retencoes.inssRetido}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    retencoes: { ...formData.retencoes, inssRetido: checked as boolean }
                  })}
                />
                <Label htmlFor="retencoes.inssRetido" className="cursor-pointer">INSS Retido</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retencoes.irRetido"
                  checked={formData.retencoes.irRetido}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    retencoes: { ...formData.retencoes, irRetido: checked as boolean }
                  })}
                />
                <Label htmlFor="retencoes.irRetido" className="cursor-pointer">IR Retido</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retencoes.csllRetido"
                  checked={formData.retencoes.csllRetido}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    retencoes: { ...formData.retencoes, csllRetido: checked as boolean }
                  })}
                />
                <Label htmlFor="retencoes.csllRetido" className="cursor-pointer">CSLL Retido</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
