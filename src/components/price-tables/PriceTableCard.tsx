import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Eye, Trash2, Check, X, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PriceTable {
  id: string;
  name: string;
  gender: string;
  visible_in_pdv: boolean;
  default_seller_commission: number;
  default_representative_commission: number;
  default_mva: number;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

interface PriceTableCardProps {
  table: PriceTable;
  onDelete: (id: string, name: string) => void;
}

export function PriceTableCard({ table, onDelete }: PriceTableCardProps) {
  const navigate = useNavigate();

  const hasDefaultRules = 
    table.default_seller_commission > 0 ||
    table.default_representative_commission > 0 ||
    table.default_mva > 0;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{table.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {table.gender} • Atualizado em {new Date(table.updated_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cadastros/tabela-precos/${table.id}`)}
              className="hover:bg-primary/10"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/cadastros/tabela-precos/${table.id}?tab=produtos`)}
              className="hover:bg-primary/10"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(table.id, table.name)}
              className="hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-3">
          {table.visible_in_pdv ? (
            <Badge variant="default" className="bg-success/10 text-success hover:bg-success/20">
              <Check className="h-3 w-3 mr-1" />
              Visível no PDV
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              <X className="h-3 w-3 mr-1" />
              Não visível no PDV
            </Badge>
          )}
          
          {hasDefaultRules && (
            <Badge variant="outline" className="border-primary text-primary">
              Regras configuradas
            </Badge>
          )}
          
          {table.product_count !== undefined && (
            <Badge variant="outline" className="bg-accent/10">
              <Package className="h-3 w-3 mr-1" />
              {table.product_count} produtos
            </Badge>
          )}
        </div>

        {hasDefaultRules && (
          <div className="text-xs text-muted-foreground space-y-1">
            {table.default_seller_commission > 0 && (
              <div>Comissão Vendedor: {table.default_seller_commission}%</div>
            )}
            {table.default_representative_commission > 0 && (
              <div>Comissão Representante: {table.default_representative_commission}%</div>
            )}
            {table.default_mva > 0 && (
              <div>MVA: {table.default_mva}%</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}