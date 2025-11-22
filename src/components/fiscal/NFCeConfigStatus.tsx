import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNFCeValidation } from '@/hooks/useNFCeValidation';

interface NFCeConfigStatusProps {
  orgId: string;
}

export function NFCeConfigStatus({ orgId }: NFCeConfigStatusProps) {
  const { validation, isLoading } = useNFCeValidation(orgId);

  if (isLoading) {
    return null;
  }

  if (!validation) {
    return null;
  }

  const isValid = validation.is_valid;
  const errors = validation.errors || [];

  if (isValid) {
    return (
      <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Configuração OK
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          Sistema pronto para emitir NFC-e
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 h-4" />
      <AlertTitle>Configuração Incompleta</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
