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
      <DialogContent className="max-w-[950px] bg-white dark:bg-gray-950 p-0 gap-0">
        {/* Header Section with Caixa and Empresa */}
        <div className="bg-[#f5f5f5] dark:bg-gray-900 px-6 py-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label 
                htmlFor="caixa" 
                className="text-black dark:text-gray-200 mb-2 block"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                Caixa
              </Label>
              <Input
                id="caixa"
                value={user?.email || ""}
                disabled
                className="bg-white dark:bg-gray-800 border-gray-300 h-10"
                style={{ fontSize: '13px' }}
              />
            </div>
            
            <div>
              <Label 
                htmlFor="empresa" 
                className="text-black dark:text-gray-200 mb-2 block"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                Empresa
              </Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 h-10" style={{ fontSize: '13px' }}>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id} style={{ fontSize: '13px' }}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Initial Balance Button */}
          <div className="flex justify-end mt-4">
            <Button
              onClick={adicionarSaldoInicial}
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white border-0 shadow-sm"
              style={{ fontSize: '13px', padding: '8px 20px', height: 'auto' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar saldo inicial
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-6 bg-white dark:bg-gray-950">
          {/* List of Initial Balances */}
          <div className="space-y-3 min-h-[220px]">
            {saldosIniciais.map((saldo) => (
              <div 
                key={saldo.id}
                className="bg-[#5cb85c] text-white rounded-sm flex items-center justify-between"
                style={{ padding: '14px 20px' }}
              >
                <div className="flex items-center gap-4">
                  <Banknote className="w-7 h-7" strokeWidth={1.5} />
                  <span style={{ fontSize: '18px', fontWeight: 500 }}>
                    {saldo.tipo}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span style={{ fontSize: '16px', fontWeight: 500 }}>
                    {saldo.valor.toFixed(2).replace('.', ',')}
                  </span>
                  <button
                    onClick={() => removerSaldo(saldo.id)}
                    className="w-7 h-7 rounded-full bg-[#d9534f] hover:bg-[#c9302c] flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Value Footer */}
        <div 
          className="bg-black text-white flex items-center justify-center"
          style={{ padding: '22px 0' }}
        >
          <span style={{ fontSize: '20px', fontWeight: 400 }}>
            Valor total de Abertura: <span style={{ fontWeight: 700 }}>R$ {calcularTotal().toFixed(2).replace('.', ',')}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-6 bg-white dark:bg-gray-950 flex gap-4">
          <Button
            onClick={handleVoltar}
            className="flex-1 bg-[#d9534f] hover:bg-[#c9302c] text-white border-0 shadow-sm rounded"
            style={{ fontSize: '14px', padding: '11px 24px', height: 'auto', fontWeight: 500 }}
          >
            Voltar
          </Button>
          <Button
            onClick={handleSalvarEIrAoPDV}
            disabled={loading || saldosIniciais.length === 0}
            className="flex-1 bg-[#5cb85c] hover:bg-[#4cae4c] text-white border-0 shadow-sm rounded disabled:opacity-50"
            style={{ fontSize: '14px', padding: '11px 24px', height: 'auto', fontWeight: 500 }}
          >
            {loading ? "Salvando..." : "Salvar e ir ao PDV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}