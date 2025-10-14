import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "@/hooks/use-toast";
import { Warehouse, Package, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Warehouse {
  id: string;
  name: string;
  company_id: string;
  companies?: {
    name: string;
  };
}

export default function Warehouses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses", currentOrg?.id, searchTerm],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      let query = supabase
        .from("warehouses")
        .select(`
          id,
          name,
          company_id,
          companies (
            name
          )
        `)
        .eq("org_id", currentOrg.id)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Warehouse[];
    },
    enabled: !!currentOrg?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("warehouses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Depósito excluído",
        description: "Depósito excluído com sucesso!",
      });
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o depósito. Verifique se não há vínculos ativos.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (warehouseToDelete) {
      deleteMutation.mutate(warehouseToDelete.id);
    }
  };

  const toggleSelectAll = () => {
    if (selectedWarehouses.length === warehouses.length) {
      setSelectedWarehouses([]);
    } else {
      setSelectedWarehouses(warehouses.map((w) => w.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedWarehouses((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#26b9d6" }}>
            <Warehouse className="h-6 w-6 text-white" />
          </div>
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink className="text-xs text-muted-foreground">Estoque</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-lg font-semibold">Depósitos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              placeholder="Pesquisar por Nome"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-xs h-9"
            />
            <Button
              size="sm"
              className="h-9 px-3 text-xs"
              style={{ backgroundColor: "#0c5c7a" }}
            >
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            onClick={() => navigate("/cadastros/depositos/novo")}
            className="h-9 px-4 text-xs font-semibold"
            style={{ backgroundColor: "#26b9d6" }}
          >
            + NOVO
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 py-2.5 px-3">
                  <Checkbox
                    checked={selectedWarehouses.length === warehouses.length && warehouses.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="py-2.5 px-3 text-xs font-semibold text-gray-700">
                  Nome ↓
                </TableHead>
                <TableHead className="py-2.5 px-3 text-xs font-semibold text-gray-700">
                  Empresa
                </TableHead>
                <TableHead className="w-24 py-2.5 px-3 text-xs font-semibold text-gray-700 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Nenhum depósito encontrado</p>
                      <Button
                        onClick={() => navigate("/cadastros/depositos/novo")}
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs"
                      >
                        Criar Depósito
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id} className="hover:bg-gray-50">
                    <TableCell className="py-2.5 px-3">
                      <Checkbox
                        checked={selectedWarehouses.includes(warehouse.id)}
                        onCheckedChange={() => toggleSelect(warehouse.id)}
                      />
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-xs">
                      {warehouse.name}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-xs">
                      {warehouse.companies?.name || "-"}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/cadastros/depositos/editar/${warehouse.id}`)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(warehouse)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o depósito "{warehouseToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
