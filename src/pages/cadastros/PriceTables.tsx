import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Plus, Edit, Trash2, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
}

export default function PriceTables() {
  const navigate = useNavigate();
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg?.id) {
      loadPriceTables();
    }
  }, [currentOrg?.id]);

  const loadPriceTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("price_tables")
        .select("*")
        .eq("org_id", currentOrg?.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setPriceTables(data || []);
    } catch (error) {
      console.error("Erro ao carregar tabelas de preços:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tabelas de preços",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      // Verificar se há pedidos/orçamentos vinculados
      // Verificar se há pedidos/orçamentos vinculados - simulação pois não temos tabela orders ainda
      const orders: any[] = [];

      if (orders && orders.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: `Não é possível excluir esta tabela porque está vinculada a pedidos.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("price_tables")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tabela de preços excluída com sucesso",
      });

      loadPriceTables();
    } catch (error) {
      console.error("Erro ao excluir tabela de preços:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tabela de preços",
        variant: "destructive",
      });
    }
  };

  if (!currentOrg) {
    return (
      <div className="p-6">
        <p>Selecione uma organização para continuar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tabela de Preços</h1>
          <p className="text-muted-foreground">
            Gerencie as tabelas de preços da sua organização
          </p>
        </div>
        <Button onClick={() => navigate("/cadastros/tabela-precos/novo")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      {/* Lista de Tabelas */}
      <Card>
        <CardHeader>
          <CardTitle>Tabelas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : priceTables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma tabela de preços cadastrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Nome da Tabela</th>
                    <th className="text-left p-2 font-medium">Gênero</th>
                    <th className="text-center p-2 font-medium">Visível no PDV?</th>
                    <th className="text-center p-2 font-medium">Regras Padrão</th>
                    <th className="text-left p-2 font-medium">Atualizado em</th>
                    <th className="text-center p-2 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {priceTables.map((table) => (
                    <tr key={table.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{table.name}</td>
                      <td className="p-2">{table.gender}</td>
                      <td className="p-2 text-center">
                        {table.visible_in_pdv ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            <X className="h-3 w-3 mr-1" />
                            Não
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {table.default_seller_commission > 0 ||
                        table.default_representative_commission > 0 ||
                        table.default_mva > 0 ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            Aplicadas
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Não aplicadas</Badge>
                        )}
                      </td>
                      <td className="p-2">
                        {new Date(table.updated_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/cadastros/tabela-precos/${table.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/cadastros/tabela-precos/${table.id}?tab=produtos`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Tabela de Preços</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a tabela "{table.name}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(table.id, table.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}