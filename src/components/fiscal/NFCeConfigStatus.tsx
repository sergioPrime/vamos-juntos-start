import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNFCeValidation } from '@/hooks/useNFCeValidation';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NFCeConfigStatus() {
  const { validationResult, loading, validateNFCeEmission, isValid, errors } = useNFCeValidation();
  const navigate = useNavigate();

  if (loading && !validationResult) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Verificando configuração...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Status da Configuração NFC-e
              {isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </CardTitle>
            <CardDescription>
              Verifique se sua configuração está pronta para emitir NFC-e
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={validateNFCeEmission}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verificar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings/erp-config')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div>
          {isValid ? (
            <Badge className="bg-green-600">
              ✓ Configuração válida - Pronto para emitir NFC-e
            </Badge>
          ) : (
            <Badge variant="destructive">
              ✗ Configuração incompleta - Não é possível emitir NFC-e
            </Badge>
          )}
        </div>

        {/* Lista de erros */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>Pendências encontradas:</span>
            </div>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Checklist visual */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium">Checklist de Configuração:</h4>
          <div className="space-y-2 text-sm">
            <ChecklistItem
              label="Certificado Digital (A1)"
              checked={!errors.some((e) => e.includes('Certificado'))}
            />
            <ChecklistItem
              label="CSC (Código de Segurança do Contribuinte)"
              checked={!errors.some((e) => e.includes('CSC'))}
            />
            <ChecklistItem
              label="Dados do Emitente (CNPJ, IE, Razão Social)"
              checked={
                !errors.some((e) => e.includes('CNPJ')) &&
                !errors.some((e) => e.includes('Inscrição')) &&
                !errors.some((e) => e.includes('Razão Social'))
              }
            />
            <ChecklistItem
              label="Endereço Completo"
              checked={
                !errors.some((e) => e.includes('Endereço')) &&
                !errors.some((e) => e.includes('Município'))
              }
            />
            <ChecklistItem
              label="Série NFC-e Configurada"
              checked={!errors.some((e) => e.includes('Série'))}
            />
          </div>
        </div>

        {/* Informações adicionais */}
        {isValid && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Tudo pronto!</strong> Você já pode emitir NFC-e. Recomendamos testar em
              ambiente de homologação antes de usar em produção.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface ChecklistItemProps {
  label: string;
  checked: boolean;
}

function ChecklistItem({ label, checked }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
