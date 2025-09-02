import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Search, Edit2, Trash2, Building2, User, Phone, Mail, MapPin, FileText, CreditCard, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { useSupplierForm, SupplierFormData } from '@/hooks/useSupplierForm';

interface Supplier {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  contact_person: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  supplier_type: string;
  credit_limit: number;
  payment_terms: string;
  is_active: boolean;
  notes: string;
  status: string;
  legal_name?: string;
  trade_name?: string;
  full_name?: string;
  state_registration?: string;
  municipal_registration?: string;
  cnae_code?: string;
  business_activity?: string;
  main_contact_name?: string;
  landline_phone?: string;
  mobile_phone?: string;
  whatsapp_phone?: string;
  billing_email?: string;
  website_url?: string;
  street_type?: string;
  street_name?: string;
  street_number?: string;
  complement?: string;
  neighborhood?: string;
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  pix_key?: string;
  default_payment_terms?: string;
  average_delivery_time?: string;
  commercial_notes?: string;
  general_observations?: string;
  created_at: string;
  updated_at: string;
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { toast } = useToast();
  const { currentOrg } = useOrganization();
  const { form, isLoading: formLoading, createSupplier, updateSupplier, validateDocument, formatDocument, searchAddressByCEP } = useSupplierForm();

  useEffect(() => {
    fetchSuppliers();
  }, [currentOrg]);

  const fetchSuppliers = async () => {
    if (!currentOrg?.id) return;

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar fornecedores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: SupplierFormData) => {
    let result;
    
    if (editingSupplier) {
      result = await updateSupplier(editingSupplier.id, data);
    } else {
      result = await createSupplier(data);
    }

    if (result) {
      fetchSuppliers();
      closeDialog();
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso",
      });

      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir fornecedor",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    
    // Reset form with supplier data
    form.reset({
      supplier_type: supplier.supplier_type === 'individual' ? 'individual' : 'legal',
      legal_name: supplier.legal_name || '',
      trade_name: supplier.trade_name || '',
      full_name: supplier.full_name || '',
      document: supplier.document || '',
      state_registration: supplier.state_registration || '',
      municipal_registration: supplier.municipal_registration || '',
      cnae_code: supplier.cnae_code || '',
      business_activity: supplier.business_activity || '',
      status: (supplier.status as 'active' | 'inactive' | 'blocked') || 'active',
      main_contact_name: supplier.main_contact_name || '',
      landline_phone: supplier.landline_phone || '',
      mobile_phone: supplier.mobile_phone || '',
      whatsapp_phone: supplier.whatsapp_phone || '',
      email: supplier.email || '',
      billing_email: supplier.billing_email || '',
      website_url: supplier.website_url || '',
      zip_code: supplier.zip_code || '',
      street_type: supplier.street_type || '',
      street_name: supplier.street_name || '',
      street_number: supplier.street_number || '',
      complement: supplier.complement || '',
      neighborhood: supplier.neighborhood || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || 'BR',
      bank_name: supplier.bank_name || '',
      bank_agency: supplier.bank_agency || '',
      bank_account: supplier.bank_account || '',
      pix_key: supplier.pix_key || '',
      default_payment_terms: supplier.default_payment_terms || '',
      credit_limit: supplier.credit_limit || 0,
      average_delivery_time: supplier.average_delivery_time || '',
      commercial_notes: supplier.commercial_notes || '',
      general_observations: supplier.general_observations || '',
    });
    
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    form.reset();
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.document?.includes(searchTerm) ||
                         supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.trade_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    const matchesType = typeFilter === 'all' || supplier.supplier_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-6">Carregando fornecedores...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os fornecedores da sua empresa de forma completa e organizada
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier 
                  ? 'Edite as informações completas do fornecedor'
                  : 'Cadastre um novo fornecedor com todas as informações necessárias'
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                    <TabsTrigger value="contact">Contatos</TabsTrigger>
                    <TabsTrigger value="address">Endereço</TabsTrigger>
                    <TabsTrigger value="financial">Financeiro</TabsTrigger>
                    <TabsTrigger value="docs">Documentação</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="supplier_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Fornecedor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="legal">Pessoa Jurídica</SelectItem>
                                <SelectItem value="individual">Pessoa Física</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch('supplier_type') === 'legal' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="legal_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Razão Social *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Razão social da empresa" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="trade_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Fantasia</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome fantasia" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo *</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome completo da pessoa física" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="document"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch('supplier_type') === 'legal' ? 'CNPJ *' : 'CPF *'}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={form.watch('supplier_type') === 'legal' ? '00.000.000/0000-00' : '000.000.000-00'} 
                                  {...field}
                                  onChange={(e) => {
                                    const formatted = formatDocument(e.target.value, form.watch('supplier_type'));
                                    field.onChange(formatted);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">Ativo</SelectItem>
                                  <SelectItem value="inactive">Inativo</SelectItem>
                                  <SelectItem value="blocked">Bloqueado</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch('supplier_type') === 'legal' && (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="state_registration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Inscrição Estadual</FormLabel>
                                <FormControl>
                                  <Input placeholder="000.000.000.000 ou Isento" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="municipal_registration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Inscrição Municipal</FormLabel>
                                <FormControl>
                                  <Input placeholder="Inscrição municipal" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cnae_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código CNAE</FormLabel>
                              <FormControl>
                                <Input placeholder="0000-0/00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="business_activity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ramo de Atividade</FormLabel>
                              <FormControl>
                                <Input placeholder="Descrição da atividade" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="main_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Contato Principal</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do responsável" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="landline_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone Fixo</FormLabel>
                              <FormControl>
                                <Input placeholder="(11) 3000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mobile_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone Celular</FormLabel>
                              <FormControl>
                                <Input placeholder="(11) 99000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="whatsapp_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp</FormLabel>
                              <FormControl>
                                <Input placeholder="(11) 99000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail Principal</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="contato@fornecedor.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="billing_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail de Cobrança/Financeiro</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="financeiro@fornecedor.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="website_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.fornecedor.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="address" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="zip_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="00000-000" 
                                  {...field}
                                  onBlur={(e) => {
                                    field.onBlur();
                                    searchAddressByCEP(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>CEP com busca automática</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="street_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Logradouro</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Rua">Rua</SelectItem>
                                  <SelectItem value="Avenida">Avenida</SelectItem>
                                  <SelectItem value="Travessa">Travessa</SelectItem>
                                  <SelectItem value="Alameda">Alameda</SelectItem>
                                  <SelectItem value="Praça">Praça</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="street_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logradouro</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da rua/avenida" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="street_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input placeholder="123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input placeholder="Sala, andar, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bairro</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do bairro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da cidade" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado (UF)</FormLabel>
                              <FormControl>
                                <Input placeholder="SP" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>País</FormLabel>
                              <FormControl>
                                <Input placeholder="BR" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-4">
                    <div className="grid gap-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Dados Bancários
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="bank_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Banco</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do banco" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_agency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Agência</FormLabel>
                              <FormControl>
                                <Input placeholder="0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_account"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conta</FormLabel>
                              <FormControl>
                                <Input placeholder="00000-0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="pix_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave PIX</FormLabel>
                            <FormControl>
                              <Input placeholder="E-mail, telefone, CPF/CNPJ ou chave aleatória" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <h4 className="font-medium">Condições Comerciais</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="default_payment_terms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Condição de Pagamento Padrão</FormLabel>
                              <FormControl>
                                <Input placeholder="30 dias, à vista, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="credit_limit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Limite de Crédito Concedido</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="average_delivery_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prazo Médio de Entrega</FormLabel>
                            <FormControl>
                              <Input placeholder="5 dias úteis, 2 semanas, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="commercial_notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações Comerciais</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Informações sobre condições especiais, descontos, etc."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="docs" className="space-y-4">
                    <div className="grid gap-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentação e Anexos
                      </h4>
                      
                      <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2" />
                        <p>Upload de documentos será implementado em breve</p>
                        <p className="text-sm">Contratos, certidões, comprovantes, etc.</p>
                      </div>

                      <FormField
                        control={form.control}
                        name="general_observations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações Gerais</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Informações adicionais importantes sobre o fornecedor"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Salvando...' : editingSupplier ? 'Atualizar' : 'Criar'} Fornecedor
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lista de Fornecedores
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, documento, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-80"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="legal">PJ</SelectItem>
                  <SelectItem value="individual">PF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Carregando fornecedores...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                        ? 'Nenhum fornecedor encontrado com os filtros aplicados'
                        : 'Nenhum fornecedor cadastrado. Clique em "Novo Fornecedor" para começar.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {supplier.supplier_type === 'legal' ? (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                            {supplier.name}
                          </div>
                          {supplier.main_contact_name && (
                            <div className="text-sm text-muted-foreground">
                              Contato: {supplier.main_contact_name}
                            </div>
                          )}
                          {supplier.business_activity && (
                            <div className="text-xs text-muted-foreground">
                              {supplier.business_activity}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{supplier.document}</span>
                        {supplier.state_registration && (
                          <div className="text-xs text-muted-foreground">
                            IE: {supplier.state_registration}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-36">{supplier.email}</span>
                            </div>
                          )}
                          {(supplier.mobile_phone || supplier.phone) && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {supplier.mobile_phone || supplier.phone}
                            </div>
                          )}
                          {supplier.city && supplier.state && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {supplier.city}, {supplier.state}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {supplier.supplier_type === 'legal' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            supplier.status === 'active' ? "default" : 
                            supplier.status === 'blocked' ? "destructive" : "secondary"
                          }
                        >
                          {supplier.status === 'active' ? 'Ativo' : 
                           supplier.status === 'blocked' ? 'Bloqueado' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(supplier)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSupplier(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Suppliers;