import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface AuditFiltersValues {
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface AuditFiltersProps {
  onFiltersChange: (filters: AuditFiltersValues) => void;
  onClear: () => void;
}

const actionOptions = [
  { value: 'INSERT', label: 'Criação' },
  { value: 'UPDATE', label: 'Atualização' },
  { value: 'DELETE', label: 'Exclusão' },
  { value: 'APPROVE', label: 'Aprovação' },
  { value: 'REJECT', label: 'Rejeição' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
];

const entityTypeOptions = [
  { value: 'products', label: 'Produtos' },
  { value: 'customers', label: 'Clientes' },
  { value: 'suppliers', label: 'Fornecedores' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'financial_entries', label: 'Lançamentos Financeiros' },
  { value: 'stock_movements', label: 'Movimentos de Estoque' },
  { value: 'users', label: 'Usuários' },
];

export function AuditFilters({ onFiltersChange, onClear }: AuditFiltersProps) {
  const [filters, setFilters] = useState<AuditFiltersValues>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof AuditFiltersValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {Object.values(filters).filter(v => v !== undefined && v !== '').length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="start">
            <div className="space-y-4">
              <div>
                <Label htmlFor="action">Ação</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => handleFilterChange('action', value)}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entityType">Tipo de Entidade</Label>
                <Select
                  value={filters.entityType}
                  onValueChange={(value) => handleFilterChange('entityType', value)}
                >
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="Todas as entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.startDate ? (
                        format(filters.startDate, 'PPP', { locale: ptBR })
                      ) : (
                        'Selecione uma data'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => handleFilterChange('startDate', date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.endDate ? (
                        format(filters.endDate, 'PPP', { locale: ptBR })
                      ) : (
                        'Selecione uma data'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => handleFilterChange('endDate', date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Buscar por email, IP, etc..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
