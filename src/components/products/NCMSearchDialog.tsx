import { useState } from "react"
import { Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface NCMResult {
  codigo: string
  descricao: string
  data_inicio: string
  data_fim: string
  tipo_ato: string
  numero_ato: string
  ano_ato: string
}

interface NCMSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (ncm: string) => void
  productName?: string
}

export function NCMSearchDialog({ open, onOpenChange, onSelect, productName }: NCMSearchDialogProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState(productName || "")
  const [results, setResults] = useState<NCMResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState("")

  const handleSearch = async () => {
    if (!searchTerm || searchTerm.trim().length < 3) {
      toast({
        title: "Termo muito curto",
        description: "Digite pelo menos 3 caracteres para buscar",
        variant: "destructive"
      })
      return
    }

    setIsSearching(true)
    setResults([])
    setSearchMessage("")

    try {
      const { data, error } = await supabase.functions.invoke('search-ncm', {
        body: { searchTerm: searchTerm.trim() }
      })

      if (error) throw error

      if (data.results && Array.isArray(data.results)) {
        setResults(data.results)
        setSearchMessage(data.message || `${data.results.length} resultado(s) encontrado(s)`)
        
        if (data.results.length === 0) {
          toast({
            title: "Nenhum resultado",
            description: "Tente outros termos de busca ou consulte manualmente a tabela NCM",
          })
        }
      } else {
        throw new Error("Formato de resposta inválido")
      }
    } catch (error: any) {
      console.error('Error searching NCM:', error)
      toast({
        title: "Erro na busca",
        description: error.message || "Não foi possível buscar NCM. Tente novamente.",
        variant: "destructive"
      })
      setSearchMessage("Erro ao buscar. Tente novamente.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectNCM = (ncm: NCMResult) => {
    onSelect(ncm.codigo)
    toast({
      title: "NCM selecionado",
      description: `${ncm.codigo} - ${ncm.descricao.substring(0, 50)}...`
    })
    onOpenChange(false)
    // Limpar resultados ao fechar
    setTimeout(() => {
      setResults([])
      setSearchMessage("")
    }, 300)
  }

  const formatNCM = (codigo: string) => {
    // Formatar NCM: 0000.00.00
    if (codigo.length === 8) {
      return `${codigo.substring(0, 4)}.${codigo.substring(4, 6)}.${codigo.substring(6, 8)}`
    }
    return codigo
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Código NCM
          </DialogTitle>
          <DialogDescription>
            Digite a descrição do produto para encontrar o código NCM correto. 
            A busca é feita na base da Receita Federal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite a descrição do produto (ex: notebook, calçado, alimento)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSearching) {
                  handleSearch()
                }
              }}
              disabled={isSearching}
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || searchTerm.trim().length < 3}
              className="min-w-[100px]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {/* Mensagem de status */}
          {searchMessage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {results.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              {searchMessage}
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-4 space-y-2">
                {results.map((result, index) => (
                  <div
                    key={`${result.codigo}-${index}`}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectNCM(result)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-base">
                            {formatNCM(result.codigo)}
                          </Badge>
                          {result.data_fim && (
                            <Badge variant="destructive" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">
                          {result.descricao}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Vigência: {new Date(result.data_inicio).toLocaleDateString('pt-BR')}</span>
                          {result.data_fim && (
                            <span>até {new Date(result.data_fim).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectNCM(result)
                        }}
                      >
                        Selecionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Estado vazio */}
          {!isSearching && results.length === 0 && !searchMessage && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                Digite a descrição do produto e clique em Buscar
              </p>
              <p className="text-xs mt-2">
                Exemplo: "notebook", "calçado esportivo", "alimento processado"
              </p>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
              💡 Dicas para uma busca eficiente:
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use termos gerais primeiro (ex: "eletrônico", "têxtil", "alimento")</li>
              <li>• Adicione características específicas se necessário</li>
              <li>• Consulte a descrição completa antes de selecionar</li>
              <li>• Em caso de dúvida, consulte um contador ou despachante</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
