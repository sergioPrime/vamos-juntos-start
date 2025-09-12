import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBankAccounts, type BankAccount, type CreateBankAccountData } from '@/hooks/useBankAccounts';
import { WalletCardsGrid } from './WalletCardsGrid';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

const bankAccountSchema = z.object({
  bank_name: z.string().min(1, 'Nome do banco é obrigatório'),
  company_id: z.string().min(1, 'Empresa é obrigatória'),
  bank_code: z.string().optional(),
  account_number: z.string().min(1, 'Número da conta é obrigatório'),
  agency: z.string().optional(),
  agency_digit: z.string().max(1, 'Máximo 1 dígito').optional(),
  account_digit: z.string().max(1, 'Máximo 1 dígito').optional(),
  account_type: z.string().min(1, 'Tipo da conta é obrigatório'),
  balance: z.number().min(0, 'Saldo deve ser positivo').optional(),
  emit_boletos_erp: z.boolean().optional(),
  enable_pix_sales: z.boolean().optional(),
  initial_number: z.number().min(0).optional(),
  monthly_interest: z.number().min(0).max(100).optional(),
  fine_percentage: z.number().min(0).max(100).optional(),
  discount_until_due: z.number().min(0).max(100).optional(),
  emit_with_receipt: z.boolean().optional(),
  payment_instruction_after_due: z.string().optional(),
  bank_can_protest: z.boolean().optional(),
  bank_can_return: z.boolean().optional(),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface BankAccountFormProps {
  account?: BankAccount | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Predefined banks with codes
const PREDEFINED_BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '756', name: 'Sicoob' },
  { code: '748', name: 'Sicredi' },
  { code: '422', name: 'Safra' },
  { code: '389', name: 'Mercado Pago' },
  { code: '260', name: 'Nubank' },
  { code: '077', name: 'Inter' },
  { code: '336', name: 'C6 Bank' },
  { code: '290', name: 'PagSeguro' },
  { code: '323', name: 'Mercado Crédito' },
];

export function BankAccountForm({ account, onSuccess, onCancel }: BankAccountFormProps) {
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account-info');
  
  const { createAccount, updateAccount } = useBankAccounts();
  const { currentOrg } = useOrganization();

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_name: account?.bank_name || '',
      company_id: account?.company_id || '',
      bank_code: account?.bank_code || '',
      account_number: account?.account_number || '',
      agency: account?.agency || '',
      agency_digit: account?.agency_digit || '',
      account_digit: account?.account_digit || '',
      account_type: account?.account_type || 'checking',
      balance: account?.balance || 0,
      emit_boletos_erp: account?.emit_boletos_erp || false,
      enable_pix_sales: account?.enable_pix_sales || false,
      initial_number: account?.initial_number || 0,
      monthly_interest: account?.monthly_interest || 0,
      fine_percentage: account?.fine_percentage || 0,
      discount_until_due: account?.discount_until_due || 0,
      emit_with_receipt: account?.emit_with_receipt || false,
      payment_instruction_after_due: account?.payment_instruction_after_due || '',
      bank_can_protest: account?.bank_can_protest || false,
      bank_can_return: account?.bank_can_return || false,
    },
  });

  const loadCompanies = async () => {
    if (!currentOrg?.id) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [currentOrg?.id]);

  const onSubmit = async (data: BankAccountFormData) => {
    setLoading(true);
    try {
      if (account) {
        await updateAccount(account.id, data);
      } else {
        await createAccount(data as CreateBankAccountData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelect = (value: string) => {
    const selectedBank = PREDEFINED_BANKS.find(bank => bank.code === value);
    if (selectedBank) {
      form.setValue('bank_code', selectedBank.code);
      form.setValue('bank_name', selectedBank.name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {account ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
        </CardTitle>
        <CardDescription>
          Preencha as informações da conta bancária e configurações de boletos
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account-info">Informações da Conta</TabsTrigger>
                <TabsTrigger value="boleto-config">Emissão de Boletos</TabsTrigger>
              </TabsList>

              {/* Account Information Tab */}
              <TabsContent value="account-info" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Banco *</FormLabel>
                        <Select onValueChange={handleBankSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {PREDEFINED_BANKS.map((bank) => (
                              <SelectItem key={bank.code} value={bank.code}>
                                {bank.code} - {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.value && (
                          <Input
                            {...field}
                            placeholder="Nome do banco"
                            className="mt-2"
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Saldo Inicial (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência</FormLabel>
                        <FormControl>
                          <Input placeholder="1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agency_digit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dígito Agência</FormLabel>
                        <FormControl>
                          <Input placeholder="7" maxLength={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_digit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dígito Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="9" maxLength={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo da Conta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="checking">Conta Corrente</SelectItem>
                            <SelectItem value="savings">Poupança</SelectItem>
                            <SelectItem value="investment">Investimento</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emit_boletos_erp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Emitir boletos pelo ERP
                          </FormLabel>
                          <FormDescription>
                            Habilita a emissão de boletos através do sistema
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enable_pix_sales"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Habilitar recebimento via PIX nas vendas
                          </FormLabel>
                          <FormDescription>
                            Permite recebimento via PIX nas vendas
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Boleto Configuration Tab */}
              <TabsContent value="boleto-config" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="initial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nosso Número Inicial</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthly_interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juros Mensais (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fine_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multa (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount_until_due"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto até o Vencimento (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="payment_instruction_after_due"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instrução para pagamento após o vencimento</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Instrução para pagamento em atraso..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emit_with_receipt"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Emitir boleto com comprovante de recebimento
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_can_protest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Banco pode protestar boletos?
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_can_return"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Banco pode devolver boletos?
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Wallets Section */}
                {account && (
                  <div className="space-y-4">
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Carteiras Habilitadas</h3>
                      <WalletCardsGrid bankAccountId={account.id} />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : account ? 'Atualizar' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}