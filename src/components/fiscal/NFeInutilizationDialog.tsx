import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNFeInutilizations } from '@/hooks/useNFeInutilizations';

interface NFeInutilizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fiscalConfigs: Array<{
    id: string;
    razao_social: string;
    cnpj: string;
    serie_nfe: string;
  }>;
  onSuccess?: () => void;
}

export function NFeInutilizationDialog({
  open,
  onOpenChange,
  fiscalConfigs,
  onSuccess,
}: NFeInutilizationDialogProps) {
  const { createInutilization } = useNFeInutilizations();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fiscalConfigId: '',
    serie: '',
    numeroInicial: '',
    numeroFinal: '',
    justificativa: '',
    ano: new Date().getFullYear().toString(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fiscalConfigId) {
      return;
    }

    if (!formData.numeroInicial || !formData.numeroFinal) {
      return;
    }

    if (parseInt(formData.numeroInicial) > parseInt(formData.numeroFinal)) {
      return;
    }

    if (formData.justificativa.length < 15) {
      return;
    }

    setLoading(true);
    try {
      await createInutilization({
        fiscalConfigId: formData.fiscalConfigId,
        serie: formData.serie || '1',
        numeroInicial: parseInt(formData.numeroInicial),
        numeroFinal: parseInt(formData.numeroFinal),
        justificativa: formData.justificativa,
        ano: parseInt(formData.ano),
      });

      setFormData({
        fiscalConfigId: '',
        serie: '',
        numeroInicial: '',
        numeroFinal: '',
        justificativa: '',
        ano: new Date().getFullYear().toString(),
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao inutilizar numeração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiscalConfigChange = (configId: string) => {
    const config = fiscalConfigs.find(c => c.id === configId);
    setFormData(prev => ({
      ...prev,
      fiscalConfigId: configId,
      serie: config?.serie_nfe || '1',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inutilizar Numeração de NFe</DialogTitle>
          <DialogDescription>
            Inutilize uma faixa de números de NFe que não foram utilizados
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A inutilização de numeração é irreversível e deve ser utilizada apenas quando
            números de NFe não puderem ser utilizados (ex: problemas no sistema, erro na sequência).
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fiscalConfig">Empresa *</Label>
            <Select
              value={formData.fiscalConfigId}
              onValueChange={handleFiscalConfigChange}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serie">Série *</Label>
              <Input
                id="serie"
                value={formData.serie}
                onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                placeholder="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                min="2000"
                max="2099"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroInicial">Número Inicial *</Label>
              <Input
                id="numeroInicial"
                type="number"
                value={formData.numeroInicial}
                onChange={(e) => setFormData({ ...formData, numeroInicial: e.target.value })}
                placeholder="1"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroFinal">Número Final *</Label>
              <Input
                id="numeroFinal"
                type="number"
                value={formData.numeroFinal}
                onChange={(e) => setFormData({ ...formData, numeroFinal: e.target.value })}
                placeholder="10"
                min="1"
                required
              />
            </div>
          </div>

          {formData.numeroInicial && formData.numeroFinal && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Serão inutilizados {parseInt(formData.numeroFinal) - parseInt(formData.numeroInicial) + 1} número(s) de NFe
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa * (mín. 15 caracteres)</Label>
            <Textarea
              id="justificativa"
              value={formData.justificativa}
              onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
              placeholder="Descreva o motivo da inutilização..."
              rows={4}
              minLength={15}
              required
            />
            <p className="text-sm text-muted-foreground">
              {formData.justificativa.length}/15 caracteres
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inutilizando...
                </>
              ) : (
                'Inutilizar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
