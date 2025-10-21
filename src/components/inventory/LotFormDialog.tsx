import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductSelector } from '@/components/ui/product-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const lotSchema = z.object({
  lot_number: z.string().min(1, 'Número do lote é obrigatório'),
  product_id: z.string().uuid('Produto é obrigatório'),
  quantity: z.coerce.number().min(1, 'Quantidade deve ser maior que zero'),
  manufacturing_date: z.string().optional(),
  expiration_date: z.string().optional(),
  status: z.enum(['active', 'expired', 'used']),
});

type LotFormData = z.infer<typeof lotSchema>;

interface LotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot?: any;
  onSuccess: () => void;
}

export function LotFormDialog({ open, onOpenChange, lot, onSuccess }: LotFormDialogProps) {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();

  const form = useForm<LotFormData>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      lot_number: '',
      product_id: '',
      quantity: 1,
      manufacturing_date: '',
      expiration_date: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (lot) {
      form.reset({
        lot_number: lot.lot_number || '',
        product_id: lot.product_id || '',
        quantity: lot.quantity || 1,
        manufacturing_date: lot.manufacturing_date || '',
        expiration_date: lot.expiration_date || '',
        status: lot.status || 'active',
      });
    } else {
      form.reset({
        lot_number: '',
        product_id: '',
        quantity: 1,
        manufacturing_date: '',
        expiration_date: '',
        status: 'active',
      });
    }
  }, [lot, form]);

  const onSubmit = async (data: LotFormData) => {
    if (!currentOrg?.id) return;

    try {
      const payload = {
        lot_number: data.lot_number,
        product_id: data.product_id,
        quantity: data.quantity,
        status: data.status,
        org_id: currentOrg.id,
        manufacturing_date: data.manufacturing_date || null,
        expiration_date: data.expiration_date || null,
      };

      if (lot) {
        const { error } = await supabase
          .from('lot_management')
          .update(payload)
          .eq('id', lot.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lot_management')
          .insert([payload]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar lote',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lot ? 'Editar Lote' : 'Novo Lote'}</DialogTitle>
          <DialogDescription>
            {lot ? 'Atualize as informações do lote' : 'Cadastre um novo lote de produtos'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="lot_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Lote *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: LOT-2025-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto *</FormLabel>
                  <FormControl>
                    <ProductSelector
                      onSelect={(product) => field.onChange(product.id)}
                      placeholder="Selecione o produto"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade *</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fabricação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="expired">Vencido</SelectItem>
                      <SelectItem value="used">Usado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {lot ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
