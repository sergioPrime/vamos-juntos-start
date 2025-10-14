import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "@/hooks/use-toast";
import { Warehouse, Search, Pencil, Trash2, Filter } from "lucide-react";
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

interface WarehouseData {
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
  const [warehouseToDelete, setWarehouseToDelete] = useState<WarehouseData | null>(null);

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
      return data as WarehouseData[];
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

  const handleDelete = (warehouse: WarehouseData) => {
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
    <div className="min-h-screen bg-[#e8e8e8]">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <div className="p-2.5 rounded" style={{ backgroundColor: "#20b5d5" }}>
            <Warehouse className="h-7 w-7 text-white" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] text-gray-600 mb-0.5">Estoque &gt;</p>
            <h1 className="text-[22px] font-normal text-gray-900">Depósitos</h1>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Pesquisar por Nome"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-sm h-10 w-[280px] border-gray-300"
            />
            <Button
              size="sm"
              className="h-10 w-10 p-0 bg-black hover:bg-gray-800"
            >
              <Search className="h-4 w-4 text-white" />
            </Button>
          </div>

          <Button
            onClick={() => navigate("/cadastros/depositos/novo")}
            className="h-10 px-5 text-sm font-medium bg-[#20b5d5] hover:bg-[#1a9ab8] text-white"
          >
            + NOVO
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f5f5f5] hover:bg-[#f5f5f5] border-b border-gray-200">
                <TableHead className="w-12 h-11 px-4">
                  <Checkbox
                    checked={selectedWarehouses.length === warehouses.length && warehouses.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="h-11 px-4 text-[13px] font-semibold text-gray-700">
                  Nome ↓
                </TableHead>
                <TableHead className="h-11 px-4 text-[13px] font-semibold text-gray-700">
                  Empresa
                </TableHead>
                <TableHead className="w-20 h-11 px-4 text-right">
                  <Filter className="h-4 w-4 text-gray-600 ml-auto" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-sm text-gray-500">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <p className="text-sm text-gray-500 mb-3">Nenhum depósito encontrado</p>
                    <Button
                      onClick={() => navigate("/cadastros/depositos/novo")}
                      variant="outline"
                      size="sm"
                      className="text-sm"
                    >
                      Criar Depósito
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell className="h-12 px-4">
                      <Checkbox
                        checked={selectedWarehouses.includes(warehouse.id)}
                        onCheckedChange={() => toggleSelect(warehouse.id)}
                      />
                    </TableCell>
                    <TableCell className="h-12 px-4 text-[13px] text-[#5e4db2] font-medium">
                      {warehouse.name}
                    </TableCell>
                    <TableCell className="h-12 px-4 text-[13px] text-gray-700">
                      {warehouse.companies?.name || "-"}
                    </TableCell>
                    <TableCell className="h-12 px-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => navigate(`/cadastros/depositos/editar/${warehouse.id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(warehouse)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
