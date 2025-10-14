import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { supabase } from "@/integrations/supabase/client"
import { Plus, X, Banknote } from "lucide-react"

interface AbrirCaixaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface SaldoInicial {
  id: string
  tipo: string
  valor: number
}

interface Company {
  id: string
  name: string
}

export const AbrirCaixaDialog = ({ open, onOpenChange, onSuccess }: AbrirCaixaDialogProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState("")
  const [saldosIniciais, setSaldosIniciais] = useState<SaldoInicial[]>([])
  const [valorDinheiro, setValorDinheiro] = useState("")
  const [loading, setLoading] = useState(false)

  // Load companies
  useEffect(() => {
    const loadCompanies = async () => {
      if (!currentOrg?.id) return

      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)
        .order('name')

      if (!error && data) {
        setCompanies(data)
        // Auto-select first or default company
        const defaultCompany = data.find(c => c.name.includes('default')) || data[0]
        if (defaultCompany) {
          setSelectedCompany(defaultCompany.id)
        }
      }
    }

    if (open) {
      loadCompanies()
    }
  }, [currentOrg, open])

  const adicionarSaldoInicial = () => {
    if (!valorDinheiro || parseFloat(valorDinheiro) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor válido para adicionar",
        variant: "destructive"
      })
      return
    }

    const novoSaldo: SaldoInicial = {
      id: Date.now().toString(),
      tipo: 'Dinheiro',
      valor: parseFloat(valorDinheiro)
    }

    setSaldosIniciais([...saldosIniciais, novoSaldo])
    setValorDinheiro("")
  }

  const removerSaldo = (id: string) => {
    setSaldosIniciais(saldosIniciais.filter(s => s.id !== id))
  }

  const calcularTotal = () => {
    return saldosIniciais.reduce((total, saldo) => total + saldo.valor, 0)
  }

  const handleSalvarEIrAoPDV = async () => {
    if (saldosIniciais.length === 0) {
      toast({
        title: "Adicione um saldo inicial",
        description: "É necessário adicionar ao menos um valor para abertura do caixa",
        variant: "destructive"
      })
      return
    }

    if (!selectedCompany) {
      toast({
        title: "Selecione uma empresa",
        description: "É necessário selecionar uma empresa",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const valorTotal = calcularTotal()

      // Insert cash session
      const { data: sessao, error: sessaoError } = await supabase
        .from('caixa_sessoes')
        .insert({
          org_id: currentOrg?.id,
          usuario_abertura: user?.id,
          valor_inicial: valorTotal,
          valor_atual: valorTotal,
          status: 'aberto',
          abertura_em: new Date().toISOString()
        })
        .select()
        .single()

      if (sessaoError) throw sessaoError

      // Insert opening movements for each initial balance
      for (const saldo of saldosIniciais) {
        await supabase
          .from('caixa_movimentacoes')
          .insert({
            org_id: currentOrg?.id,
            sessao_id: sessao.id,
            tipo: 'abertura',
            valor: saldo.valor,
            descricao: `Abertura do caixa - ${saldo.tipo}`,
            created_by: user?.id
          })
      }

      toast({
        title: "Caixa aberto com sucesso!",
        description: `Valor inicial: R$ ${valorTotal.toFixed(2).replace('.', ',')}`
      })

      // Reset form
      setSaldosIniciais([])
      setValorDinheiro("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error opening cash:', error)
      toast({
        title: "Erro ao abrir caixa",
        description: "Ocorreu um erro ao abrir o caixa",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVoltar = () => {
    setSaldosIniciais([])
    setValorDinheiro("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white dark:bg-gray-950">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-normal">Abertura de Caixa</DialogTitle>
        </DialogHeader>
        
        {/* Header Section */}
        <div className="grid grid-cols-2 gap-6 py-4 bg-gray-50 dark:bg-gray-900 px-6 -mx-6">
          <div>
            <Label htmlFor="caixa" className="text-sm font-medium mb-2 block">Caixa</Label>
            <Input
              id="caixa"
              value={user?.email || ""}
              disabled
              className="bg-white dark:bg-gray-800"
            />
          </div>
          
          <div>
            <Label htmlFor="empresa" className="text-sm font-medium mb-2 block">Empresa</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="bg-white dark:bg-gray-800">
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Add Initial Balance Button */}
        <div className="flex justify-end mt-2">
          <Button
            onClick={adicionarSaldoInicial}
            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white"
            style={{ fontSize: '14px' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar saldo inicial
          </Button>
        </div>

        {/* List of Initial Balances */}
        <div className="space-y-3 min-h-[200px]">
          {saldosIniciais.map((saldo) => (
            <div 
              key={saldo.id}
              className="bg-[#5cb85c] text-white rounded px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Banknote className="w-6 h-6" />
                <span className="text-lg font-medium">{saldo.tipo}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-medium">
                  {saldo.valor.toFixed(2).replace('.', ',')}
                </span>
                <button
                  onClick={() => removerSaldo(saldo.id)}
                  className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Input field for adding money */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="valor-dinheiro" className="text-sm mb-2 block">
                Valor em Dinheiro
              </Label>
              <Input
                id="valor-dinheiro"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={valorDinheiro}
                onChange={(e) => setValorDinheiro(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    adicionarSaldoInicial()
                  }
                }}
                className="text-base"
              />
            </div>
          </div>
        </div>

        {/* Total Value Footer */}
        <div className="bg-black text-white py-6 -mx-6 -mb-6 px-6 rounded-b-lg">
          <div className="text-center text-xl">
            Valor total de Abertura: <span className="font-bold">R$ {calcularTotal().toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleVoltar}
            variant="outline"
            className="flex-1 bg-[#d9534f] hover:bg-[#c9302c] text-white border-none"
            style={{ fontSize: '15px', padding: '12px 24px' }}
          >
            Voltar
          </Button>
          <Button
            onClick={handleSalvarEIrAoPDV}
            disabled={loading || saldosIniciais.length === 0}
            className="flex-1 bg-[#5cb85c] hover:bg-[#4cae4c] text-white"
            style={{ fontSize: '15px', padding: '12px 24px' }}
          >
            {loading ? "Salvando..." : "Salvar e ir ao PDV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}