import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Receipt } from 'lucide-react';
import { EmitNFCeDialog } from './EmitNFCeDialog';
import { useOrganization } from '@/hooks/useOrganization';

interface PDVNFCeButtonProps {
  saleData: any;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

export function PDVNFCeButton({ saleData, disabled, variant = 'default' }: PDVNFCeButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { currentOrg } = useOrganization();

  if (!currentOrg) return null;

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
      >
        <Receipt className="w-4 h-4 mr-2" />
        Emitir NFC-e
      </Button>

      <EmitNFCeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        saleData={saleData}
        orgId={currentOrg.id}
      />
    </>
  );
}
