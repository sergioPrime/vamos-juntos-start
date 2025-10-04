import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from '@supabase/supabase-js'
import { Save, X } from "lucide-react"
import { toast } from "sonner"

const SUPABASE_URL = "https://wrdyffwjlylgxfbxbztf.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZHlmZndqbHlsZ3hmYnhienRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjM2NzUsImV4cCI6MjA3MTk5OTY3NX0.3YwCWx2Q0hLjkTPwRQsHCcVGe5B5uuT5FKUfAH2KXUs"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface UserDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Pessoa {
  id: string
  nome_fantasia: string
}

export function UserDataDialog({ open, onOpenChange }: UserDataDialogProps) {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [pessoaId, setPessoaId] = useState<string | null>(null)
  const [pessoaNome, setPessoaNome] = useState<string>('Selecione um vendedor')
  const [vendedores, setVendedores] = useState<Pessoa[]>([])
  const [showPessoaList, setShowPessoaList] = useState(false)

  useEffect(() => {
    if (!open || !user?.id) return

    const loadData = async () => {
      // Load user data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, whatsapp, pessoa_id')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        const name = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ')
        setFullName(name || '')
        setWhatsapp(profileData.whatsapp || '')
        setPessoaId(profileData.pessoa_id)
        
        if (profileData.pessoa_id) {
          const { data: pessoaData } = await supabase
            .from('pessoas')
            .select('nome_fantasia')
            .eq('id', profileData.pessoa_id)
            .single()
          
          if (pessoaData) {
            setPessoaNome(pessoaData.nome_fantasia)
          }
        }
      }

      // Load org and vendedores
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      
      if (orgData) {
        const { data: vendedoresData } = await supabase
          .from('pessoas')
          .select('id, nome_fantasia')
          .eq('org_id', orgData.org_id)
          .contains('rotulos', ['vendedor'])
          .order('nome_fantasia')
        
        if (vendedoresData) {
          setVendedores(vendedoresData)
        }
      }
    }

    loadData()
  }, [open, user?.id])

  const handleSave = async () => {
    if (!user?.id) return
    
    setIsSaving(true)
    try {
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          whatsapp: whatsapp,
          pessoa_id: pessoaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Dados atualizados com sucesso!')
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao atualizar dados:', error)
      toast.error('Erro ao atualizar dados')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectPessoa = (pessoa: Pessoa) => {
    setPessoaId(pessoa.id)
    setPessoaNome(pessoa.nome_fantasia)
    setShowPessoaList(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-primary">Alterar Seus Dados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Nome Responsável */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Responsável</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </div>

            {/* Pessoa */}
            <div className="space-y-2 relative">
              <Label htmlFor="pessoa">Pessoa</Label>
              <div 
                className="relative cursor-pointer"
                onClick={() => setShowPessoaList(!showPessoaList)}
              >
                <div className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-3 text-base items-center justify-center text-primary font-medium cursor-pointer hover:bg-accent transition-colors">
                  {pessoaNome}
                </div>
              </div>
              
              {showPessoaList && (
                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                  {vendedores.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum vendedor cadastrado
                    </div>
                  ) : (
                    vendedores.map((pessoa) => (
                      <div
                        key={pessoa.id}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                        onClick={() => handleSelectPessoa(pessoa)}
                      >
                        {pessoa.nome_fantasia}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Exemplo: 55XX999999999"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
