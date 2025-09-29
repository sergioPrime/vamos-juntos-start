import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface FilterState {
  search: string;
  gender: string;
  pdv_visibility: string;
  has_rules: string;
}

interface PriceTableFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  totalResults: number;
}

const genderOptions = [
  { value: "00", label: "00 - Mercadoria para Revenda" },
  { value: "01", label: "01 - Serviço" },
  { value: "02", label: "02 - Matéria Prima" },
  { value: "03", label: "03 - Produto Acabado" },
  { value: "04", label: "04 - Produto em Processo" },
];

export function PriceTableFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  totalResults 
}: PriceTableFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => value !== "" && value !== "all");
  const activeFilterCount = Object.values(filters).filter(value => value !== "" && value !== "all").length;

  return (
    <div className="space-y-4">
      {/* Busca Principal */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome da tabela..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filtros Avançados */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Select
          value={filters.gender}
          onValueChange={(value) => onFiltersChange({ ...filters, gender: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por gênero" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os gêneros</SelectItem>
            {genderOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.pdv_visibility}
          onValueChange={(value) => onFiltersChange({ ...filters, pdv_visibility: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Visibilidade no PDV" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="true">Visível no PDV</SelectItem>
            <SelectItem value="false">Não visível no PDV</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.has_rules}
          onValueChange={(value) => onFiltersChange({ ...filters, has_rules: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Regras configuradas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="true">Com regras</SelectItem>
            <SelectItem value="false">Sem regras</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>

      {/* Status dos Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Filter className="h-3 w-3 mr-1" />
              {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} ativo{activeFilterCount > 1 ? 's' : ''}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {totalResults} tabela{totalResults !== 1 ? 's' : ''} encontrada{totalResults !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}