import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, Search, Filter, Plus, Edit, Trash2, Settings2, X } from "lucide-react"
import { toast } from "sonner"

interface Pessoa {
  id: string
  nomeFantasia: string
  razaoSocial: string
  documento: string
  codigo: string
  endereco: string
  dataCadastro: string
  rotulos: string[]
  ativo: boolean
}

const mockPessoas: Pessoa[] = [
  {
    id: "1",
    nomeFantasia: "PRIMEGESTOR - SISTEMAS & GESTÃO",
    razaoSocial: "M. S. MENDES",
    documento: "055667950001113",
    codigo: "RUA DAS HELICÔNIAS, 33, SETOR COMERCIAL, 78550120, Sinop, MT",
    endereco: "RUA DAS HELICÔNIAS, 33, SETOR COMERCIAL, 78550120, Sinop, MT",
    dataCadastro: "30/05/2025",
    rotulos: ["Cliente", "Fornecedor"],
    ativo: true
  },
  {
    id: "2",
    nomeFantasia: "CEZAR",
    razaoSocial: "CEZAR",
    documento: "",
    codigo: "",
    endereco: "",
    dataCadastro: "25/05/2025",
    rotulos: ["Cliente"],
    ativo: true
  },
  {
    id: "3",
    nomeFantasia: "LUIZ",
    razaoSocial: "LUIZ",
    documento: "",
    codigo: "",
    endereco: "",
    dataCadastro: "26/05/2025",
    rotulos: ["Técnico"],
    ativo: true
  },
  {
    id: "4",
    nomeFantasia: "vinicius lemes",
    razaoSocial: "",
    documento: "07131404101",
    codigo: "Avenida dos Ipês, 2711, Jardim Imperial, 78550140, Sinop, MT",
    endereco: "Avenida dos Ipês, 2711, Jardim Imperial, 78550140, Sinop, MT",
    dataCadastro: "05/02/2025",
    rotulos: ["Colaborador"],
    ativo: true
  },
  {
    id: "5",
    nomeFantasia: "SUPERMERCADO IDEAL",
    razaoSocial: "HEEMANN SUPERMERCADO LTDA",
    documento: "10209340000180",
    codigo: "AVENIDA BRASIL, 2400, CENTRO, 78550000, Vera, MT",
    endereco: "AVENIDA BRASIL, 2400, CENTRO, 78550000, Vera, MT",
    dataCadastro: "05/02/2025",
    rotulos: ["Cliente", "Fornecedor"],
    ativo: true
  }
]

const availableColumns = [
  { key: "nomeFantasia", label: "Nome Fantasia" },
  { key: "razaoSocial", label: "Razão Social" },
  { key: "documento", label: "CNPJ/CPF" },
  { key: "codigo", label: "Código" },
  { key: "endereco", label: "Endereço" },
  { key: "dataCadastro", label: "Data de Cadastro" },
  { key: "rotulos", label: "Rótulos" },
  { key: "ativo", label: "Ativo" }
]

const availableRotulos = [
  "Cliente",
  "Transportadora", 
  "Técnico",
  "Fornecedor",
  "Colaborador",
  "Representada",
  "Vendedor",
  "Credenciada",
  "Fabricante"
]

export function PessoasListagem() {
  const [pessoas] = useState<Pessoa[]>(mockPessoas)
  const [filteredPessoas, setFilteredPessoas] = useState<Pessoa[]>(mockPessoas)
  const [selectedPessoas, setSelectedPessoas] = useState<string[]>([])
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [showColumnManager, setShowColumnManager] = useState(false)
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "nomeFantasia", "razaoSocial", "documento", "codigo", "endereco", "dataCadastro"
  ])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    nomeFantasia: "",
    razaoSocial: "",
    documento: "",
    email: "",
    categoriaRazaoSocial: "",
    cidade: "",
    cep: "",
    uf: "",
    grupo: "",
    vendedorPadrao: "",
    possuiPendencias: "",
    rotulosSelected: [] as string[],
    dataInicial: "",
    dataFinal: "",
    somenteInativos: false
  })

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    applyFilters({ ...filters }, term)
  }

  const applyFilters = (newFilters: typeof filters, searchTerm = "") => {
    let filtered = pessoas
    
    if (searchTerm) {
      filtered = filtered.filter(pessoa => 
        pessoa.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pessoa.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pessoa.documento.includes(searchTerm)
      )
    }
    
    if (newFilters.nomeFantasia) {
      filtered = filtered.filter(pessoa => 
        pessoa.nomeFantasia.toLowerCase().includes(newFilters.nomeFantasia.toLowerCase())
      )
    }
    
    if (newFilters.razaoSocial) {
      filtered = filtered.filter(pessoa => 
        pessoa.razaoSocial.toLowerCase().includes(newFilters.razaoSocial.toLowerCase())
      )
    }
    
    if (newFilters.documento) {
      filtered = filtered.filter(pessoa => 
        pessoa.documento.includes(newFilters.documento)
      )
    }
    
    if (newFilters.rotulosSelected.length > 0) {
      filtered = filtered.filter(pessoa => 
        pessoa.rotulos.some(rotulo => newFilters.rotulosSelected.includes(rotulo))
      )
    }
    
    if (newFilters.somenteInativos) {
      filtered = filtered.filter(pessoa => !pessoa.ativo)
    }
    
    setFilteredPessoas(filtered)
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    applyFilters(newFilters, searchTerm)
  }

  const clearFilters = () => {
    const emptyFilters = {
      nomeFantasia: "",
      razaoSocial: "",
      documento: "",
      email: "",
      categoriaRazaoSocial: "",
      cidade: "",
      cep: "",
      uf: "",
      grupo: "",
      vendedorPadrao: "",
      possuiPendencias: "",
      rotulosSelected: [],
      dataInicial: "",
      dataFinal: "",
      somenteInativos: false
    }
    setFilters(emptyFilters)
    setSearchTerm("")
    setFilteredPessoas(pessoas)
  }

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    )
  }

  const togglePessoaSelection = (pessoaId: string) => {
    setSelectedPessoas(prev => 
      prev.includes(pessoaId)
        ? prev.filter(id => id !== pessoaId)
        : [...prev, pessoaId]
    )
  }

  const selectAllPessoas = () => {
    if (selectedPessoas.length === filteredPessoas.length) {
      setSelectedPessoas([])
    } else {
      setSelectedPessoas(filteredPessoas.map(p => p.id))
    }
  }

  const handleEdit = (pessoa: Pessoa) => {
    toast.info(`Editar pessoa: ${pessoa.nomeFantasia}`)
  }

  const handleDelete = (pessoa: Pessoa) => {
    toast.error(`Excluir pessoa: ${pessoa.nomeFantasia}`)
  }

  const handleNewPessoa = () => {
    toast.info("Adicionar nova pessoa")
  }

  return (
    <div className="w-full space-y-4">
      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <Card>
          <CardHeader className="bg-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Busca Avançada</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedSearch(false)}
                className="text-primary-foreground hover:bg-primary/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-primary/5">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="filtro-nome">Nome / Nome Fantasia</Label>
                <Input
                  id="filtro-nome"
                  value={filters.nomeFantasia}
                  onChange={(e) => handleFilterChange("nomeFantasia", e.target.value)}
                  placeholder="Nome fantasia"
                />
              </div>
              
              <div>
                <Label htmlFor="filtro-razao">Razão Social</Label>
                <Input
                  id="filtro-razao"
                  value={filters.razaoSocial}
                  onChange={(e) => handleFilterChange("razaoSocial", e.target.value)}
                  placeholder="Razão social"
                />
              </div>
              
              <div>
                <Label htmlFor="filtro-documento">Código Identificador Único</Label>
                <Input
                  id="filtro-documento"
                  value={filters.documento}
                  onChange={(e) => handleFilterChange("documento", e.target.value)}
                  placeholder="CNPJ/CPF"
                />
              </div>
              
              <div>
                <Label htmlFor="filtro-email">E-mail</Label>
                <Input
                  id="filtro-email"
                  value={filters.email}
                  onChange={(e) => handleFilterChange("email", e.target.value)}
                  placeholder="E-mail"
                />
              </div>
              
              <div>
                <Label>Categoria Razão Social</Label>
                <Select value={filters.categoriaRazaoSocial} onValueChange={(value) => handleFilterChange("categoriaRazaoSocial", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica">CNPJ/CPF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="filtro-cidade">Cidade</Label>
                <Input
                  id="filtro-cidade"
                  value={filters.cidade}
                  onChange={(e) => handleFilterChange("cidade", e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              
              <div>
                <Label htmlFor="filtro-cep">CEP</Label>
                <Input
                  id="filtro-cep"
                  value={filters.cep}
                  onChange={(e) => handleFilterChange("cep", e.target.value)}
                  placeholder="CEP"
                />
              </div>
              
              <div>
                <Label>UF</Label>
                <Select value={filters.uf} onValueChange={(value) => handleFilterChange("uf", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mt">MT</SelectItem>
                    <SelectItem value="sp">SP</SelectItem>
                    <SelectItem value="rj">RJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Grupo</Label>
                <Select value={filters.grupo} onValueChange={(value) => handleFilterChange("grupo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grupo1">Grupo 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Vendedor Padrão</Label>
                <Select value={filters.vendedorPadrao} onValueChange={(value) => handleFilterChange("vendedorPadrao", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor1">Vendedor 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Possui Pendências</Label>
                <Select value={filters.possuiPendencias} onValueChange={(value) => handleFilterChange("possuiPendencias", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Rótulos Section */}
            <div className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {availableRotulos.map((rotulo) => (
                  <div key={rotulo} className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                      <Checkbox
                        id={`rotulo-filter-${rotulo}`}
                        checked={filters.rotulosSelected.includes(rotulo)}
                        onCheckedChange={(checked) => {
                          const newRotulos = checked 
                            ? [...filters.rotulosSelected, rotulo]
                            : filters.rotulosSelected.filter(r => r !== rotulo)
                          handleFilterChange("rotulosSelected", newRotulos)
                        }}
                      />
                    </div>
                    <Label htmlFor={`rotulo-filter-${rotulo}`} className="text-sm text-white font-medium">
                      {rotulo === "Cliente" && "Exibir Clientes"}
                      {rotulo === "Transportadora" && "Exibir Transportadoras"}
                      {rotulo === "Técnico" && "Exibir Técnicos"}
                      {rotulo === "Fornecedor" && "Exibir Fornecedores"}
                      {rotulo === "Colaborador" && "Exibir Colaboradores"}
                      {rotulo === "Representada" && "Exibir Representadas"}
                      {rotulo === "Vendedor" && "Exibir Vendedores"}
                      {rotulo === "Credenciada" && "Exibir Credenciadoras"}
                      {rotulo === "Fabricante" && "Exibir Fabricantes"}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center">
                    <Checkbox
                      id="somente-inativos"
                      checked={filters.somenteInativos}
                      onCheckedChange={(checked) => handleFilterChange("somenteInativos", checked)}
                    />
                  </div>
                  <Label htmlFor="somente-inativos" className="text-sm text-white font-medium">
                    Somente Inativos
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={() => applyFilters(filters, searchTerm)} className="bg-white text-primary hover:bg-white/90">
                Buscar
              </Button>
              <Button variant="outline" onClick={clearFilters} className="border-white text-white hover:bg-white/10">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar por Nome, CPF..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="default"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Busca Avançada
            {showAdvancedSearch && <X className="h-4 w-4" />}
          </Button>
          
          <Popover open={showColumnManager} onOpenChange={setShowColumnManager}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Mais Ações
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Colunas Visíveis</h4>
                <div className="space-y-2">
                  {availableColumns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${column.key}`}
                        checked={visibleColumns.includes(column.key)}
                        onCheckedChange={() => toggleColumnVisibility(column.key)}
                      />
                      <Label htmlFor={`column-${column.key}`} className="text-sm">
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setShowColumnManager(false)} className="w-full">
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Button onClick={handleNewPessoa} className="gap-2">
          <Plus className="h-4 w-4" />
          NOVO
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedPessoas.length === filteredPessoas.length && filteredPessoas.length > 0}
                  onCheckedChange={selectAllPessoas}
                />
              </TableHead>
              {availableColumns
                .filter(col => visibleColumns.includes(col.key))
                .map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPessoas.map((pessoa) => (
              <TableRow key={pessoa.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPessoas.includes(pessoa.id)}
                    onCheckedChange={() => togglePessoaSelection(pessoa.id)}
                  />
                </TableCell>
                {visibleColumns.includes("nomeFantasia") && (
                  <TableCell className="font-medium">{pessoa.nomeFantasia}</TableCell>
                )}
                {visibleColumns.includes("razaoSocial") && (
                  <TableCell>{pessoa.razaoSocial}</TableCell>
                )}
                {visibleColumns.includes("documento") && (
                  <TableCell>{pessoa.documento}</TableCell>
                )}
                {visibleColumns.includes("codigo") && (
                  <TableCell>{pessoa.codigo}</TableCell>
                )}
                {visibleColumns.includes("endereco") && (
                  <TableCell className="max-w-xs truncate" title={pessoa.endereco}>
                    {pessoa.endereco}
                  </TableCell>
                )}
                {visibleColumns.includes("dataCadastro") && (
                  <TableCell>{pessoa.dataCadastro}</TableCell>
                )}
                {visibleColumns.includes("rotulos") && (
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {pessoa.rotulos.map((rotulo, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {rotulo}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes("ativo") && (
                  <TableCell>
                    <Badge variant={pessoa.ativo ? "default" : "destructive"}>
                      {pessoa.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(pessoa)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pessoa)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {filteredPessoas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma pessoa encontrada com os filtros aplicados.
        </div>
      )}
    </div>
  )
}