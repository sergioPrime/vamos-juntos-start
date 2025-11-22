import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { InstallmentFilters } from '@/hooks/useInstallmentsPaginated';

interface InstallmentsFiltersProps {
  filters: InstallmentFilters;
  onFiltersChange: (filters: InstallmentFilters) => void;
  onReset: () => void;
}

export function InstallmentsFilters({ filters, onFiltersChange, onReset }: InstallmentsFiltersProps) {
  const updateFilter = (key: keyof InstallmentFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof InstallmentFilters];
    return value !== undefined && value !== '' && value !== 'all';
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Filtros</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="settled">Quitadas</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start-date-filter">Data Inicial</Label>
            <Input
              id="start-date-filter"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="end-date-filter">Data Final</Label>
            <Input
              id="end-date-filter"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="search-filter">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-filter"
                placeholder="Descrição..."
                value={filters.searchTerm || ''}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="min-amount-filter">Valor Mínimo</Label>
            <Input
              id="min-amount-filter"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={filters.minAmount || ''}
              onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          <div>
            <Label htmlFor="max-amount-filter">Valor Máximo</Label>
            <Input
              id="max-amount-filter"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={filters.maxAmount || ''}
              onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
