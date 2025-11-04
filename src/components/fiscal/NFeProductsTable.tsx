import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NFeProduct {
  id: string;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  icms_aliquota: number;
  icms_valor: number;
  ipi_aliquota: number;
  ipi_valor: number;
  pis_aliquota: number;
  pis_valor: number;
  cofins_aliquota: number;
  cofins_valor: number;
}

interface NFeProductsTableProps {
  products: NFeProduct[];
  onRemove: (id: string) => void;
  onEdit: (product: NFeProduct) => void;
  onUpdateTotals: () => void;
}

export default function NFeProductsTable({
  products,
  onRemove,
  onEdit,
}: NFeProductsTableProps) {
  const calculateTotals = () => {
    return products.reduce(
      (acc, product) => {
        acc.produtos += product.valor_total;
        acc.icms += product.icms_valor;
        acc.ipi += product.ipi_valor;
        acc.pis += product.pis_valor;
        acc.cofins += product.cofins_valor;
        return acc;
      },
      { produtos: 0, icms: 0, ipi: 0, pis: 0, cofins: 0 }
    );
  };

  const totals = calculateTotals();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
        Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>NCM</TableHead>
              <TableHead>CFOP</TableHead>
              <TableHead>Unid.</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="text-right">Vl. Unit.</TableHead>
              <TableHead className="text-right">Vl. Total</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.codigo}</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {product.descricao}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.ncm}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.cfop}</Badge>
                </TableCell>
                <TableCell>{product.unidade}</TableCell>
                <TableCell className="text-right font-mono">
                  {product.quantidade}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(product.valor_unitario)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatCurrency(product.valor_total)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(product.id)}
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

      {/* Resumo de Impostos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-muted/50 p-4 rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">Valor Produtos</p>
          <p className="font-mono font-bold text-lg">
            {formatCurrency(totals.produtos)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ICMS</p>
          <p className="font-mono font-semibold">
            {formatCurrency(totals.icms)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">IPI</p>
          <p className="font-mono font-semibold">{formatCurrency(totals.ipi)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">PIS</p>
          <p className="font-mono font-semibold">{formatCurrency(totals.pis)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">COFINS</p>
          <p className="font-mono font-semibold">
            {formatCurrency(totals.cofins)}
          </p>
        </div>
      </div>
    </div>
  );
}
