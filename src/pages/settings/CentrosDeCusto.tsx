import { useState } from "react"
import { Plus, Search, Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCostCenters, CostCenter } from "@/hooks/useCostCenters"

const costCenterSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  parent_id: z.string().optional(),
})

type CostCenterFormData = z.infer<typeof costCenterSchema>

export default function CentrosDeCusto() {
  const { costCenters, loading, createCostCenter, updateCostCenter, deleteCostCenter } = useCostCenters()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<CostCenterFormData>({
    resolver: zodResolver(costCenterSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      parent_id: "",
    },
  })

  const toggleNode = (centerId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(centerId)) {
      newExpanded.delete(centerId)
    } else {
      newExpanded.add(centerId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleEdit = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter)
    form.reset({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description || "",
      parent_id: costCenter.parent_id || "",
    })
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedCostCenter(null)
    form.reset({
      code: "",
      name: "",
      description: "",
      parent_id: "",
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: CostCenterFormData) => {
    const success = selectedCostCenter
      ? await updateCostCenter(selectedCostCenter.id, data as any)
      : await createCostCenter(data as any)

    if (success) {
      setDialogOpen(false)
      form.reset()
    }
  }

  const handleDelete = async (costCenter: CostCenter) => {
    if (confirm("Tem certeza que deseja desativar este centro de custo?")) {
      await deleteCostCenter(costCenter.id)
    }
  }

  const filterCostCenters = (costCenters: CostCenter[]): CostCenter[] => {
    return costCenters.filter(center => {
      const matchesSearch = center.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           center.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }

  const renderCostCenter = (costCenter: CostCenter, level: number = 0) => {
    const hasChildren = costCenter.children && costCenter.children.length > 0
    const isExpanded = expandedNodes.has(costCenter.id)
    
    return (
      <div key={costCenter.id} className="border-b border-border/50">
        <div 
          className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          style={{ paddingLeft: `${12 + level * 24}px` }}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNode(costCenter.id)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {costCenter.code}
                </span>
                <span className="font-medium">{costCenter.name}</span>
              </div>
              {costCenter.description && (
                <p className="text-sm text-muted-foreground mt-1">{costCenter.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(costCenter)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(costCenter)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {costCenter.children!.map(child => renderCostCenter(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const getParentCandidates = (costCenters: CostCenter[]): CostCenter[] => {
    const result: CostCenter[] = []
    const collectCenters = (centers: CostCenter[]) => {
      centers.forEach(center => {
        if (!selectedCostCenter || center.id !== selectedCostCenter.id) {
          result.push(center)
          if (center.children) {
            collectCenters(center.children)
          }
        }
      })
    }
    collectCenters(costCenters)
    return result
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando centros de custo...</p>
        </div>
      </div>
    )
  }

  const filteredCostCenters = filterCostCenters(costCenters)

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Centros de Custo</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Centro de Custo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedCostCenter ? "Editar Centro de Custo" : "Novo Centro de Custo"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input placeholder="001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do centro de custo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Centro de Custo Pai (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione centro pai" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {getParentCandidates(costCenters).map(center => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.code} - {center.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição do centro de custo"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {selectedCostCenter ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centros de Custo Cadastrados</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCostCenters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum centro de custo encontrado" : "Nenhum centro de custo cadastrado"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCostCenters.map(costCenter => renderCostCenter(costCenter))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}