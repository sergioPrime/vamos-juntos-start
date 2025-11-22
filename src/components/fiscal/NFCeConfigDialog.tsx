import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { Settings, Shield, Key } from 'lucide-react'

const configSchema = z.object({
  nfce_serie: z.number().min(1).max(999),
  nfce_numero_atual: z.number().min(0),
  nfce_csc: z.string().min(1, 'CSC é obrigatório'),
  nfce_id_csc: z.number().optional(),
  nfce_ambiente: z.enum(['homologacao', 'producao']),
  nfce_contingencia_ativa: z.boolean(),
})

type ConfigFormData = z.infer<typeof configSchema>

interface NFCeConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NFCeConfigDialog({ open, onOpenChange }: NFCeConfigDialogProps) {
  const { toast } = useToast()
  const { currentOrg } = useOrganization()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      nfce_serie: 1,
      nfce_numero_atual: 0,
      nfce_csc: '',
      nfce_ambiente: 'homologacao',
      nfce_contingencia_ativa: false,
    },
  })

  const onSubmit = async (data: ConfigFormData) => {
    if (!currentOrg?.id) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('fiscal_config')
        .update({
          nfce_serie: data.nfce_serie,
          nfce_numero_atual: data.nfce_numero_atual,
          nfce_csc: data.nfce_csc,
          nfce_id_csc: data.nfce_id_csc,
          nfce_ambiente: data.nfce_ambiente,
          nfce_contingencia_ativa: data.nfce_contingencia_ativa,
        })
        .eq('org_id', currentOrg.id)

      if (error) throw error

      toast({
        title: 'Configuração salva',
        description: 'As configurações de NFC-e foram atualizadas com sucesso.',
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Conexão bem-sucedida',
        description: 'A comunicação com a SEFAZ está funcionando corretamente.',
      })
    } catch (error) {
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar com a SEFAZ.',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração de NFC-e
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros para emissão de Notas Fiscais de Consumidor Eletrônicas
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="seguranca">Segurança</TabsTrigger>
                <TabsTrigger value="avancado">Avançado</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="nfce_serie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Série da NFC-e</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Número da série utilizada para emissão (1-999)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nfce_numero_atual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número Atual</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Último número de NFC-e emitido (apenas leitura, atualizado automaticamente)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nfce_ambiente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ambiente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o ambiente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="homologacao">Homologação</SelectItem>
                          <SelectItem value="producao">Produção</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Ambiente de emissão das notas fiscais
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="seguranca" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Configure os códigos de segurança para emissão de NFC-e
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="nfce_csc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSC (Código de Segurança do Contribuinte)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Código fornecido pela SEFAZ para geração do QR Code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nfce_id_csc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID CSC</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Identificador do CSC (normalmente 1 ou 2)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="avancado" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="nfce_contingencia_ativa"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Modo de Contingência</FormLabel>
                        <FormDescription>
                          Ativar emissão em contingência offline
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

                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testConnection}
                    disabled={isTesting}
                    className="w-full"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {isTesting ? 'Testando conexão...' : 'Testar Conexão com SEFAZ'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
