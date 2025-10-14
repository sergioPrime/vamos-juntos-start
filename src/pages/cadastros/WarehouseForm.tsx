import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Company {
  id: string;
  name: string;
}

interface WarehouseFormData {
  name: string;
  company_id: string;
}

export default function WarehouseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState<WarehouseFormData>({
    name: "",
    company_id: "",
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["companies", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("org_id", currentOrg.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Company[];
    },
    enabled: !!currentOrg?.id,
  });

  // Fetch warehouse data if editing
  const { data: warehouse } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || "",
        company_id: warehouse.company_id || "",
      });
    }
  }, [warehouse]);

  const saveMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      if (!currentOrg?.id || !user?.id) {
        throw new Error("Organização ou usuário não encontrado");
      }

      // Validate name format
      const invalidChars = /[<>\/\\:*?"'|]/;
      if (invalidChars.test(data.name)) {
        throw new Error("Nome do depósito contém caracteres inválidos");
      }

      // Check uniqueness
      const { data: existing } = await supabase
        .from("warehouses")
        .select("id")
        .eq("org_id", currentOrg.id)
        .eq("company_id", data.company_id)
        .ilike("name", data.name)
        .neq("id", id || "");

      if (existing && existing.length > 0) {
        throw new Error("Já existe um depósito com este nome para a empresa selecionada. Por favor, escolha outro nome.");
      }

      if (isEditing) {
        const { error } = await supabase
          .from("warehouses")
          .update({
            name: data.name,
            company_id: data.company_id,
          })
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("warehouses")
          .insert({
            org_id: currentOrg.id,
            company_id: data.company_id,
            name: data.name,
            created_by: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Sucesso",
        description: "Depósito salvo com sucesso!",
      });
      navigate("/cadastros/depositos");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do depósito é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.company_id) {
      toast({
        title: "Erro de validação",
        description: "Empresa é obrigatória",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#26b9d6" }}>
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="text-xs text-muted-foreground">Cadastro</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-lg font-semibold">
                      {isEditing ? "Edição de Depósito" : "Cadastro de Depósito"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="h-9 px-4 text-xs font-semibold"
              style={{ backgroundColor: "#26b9d6" }}
            >
              Salvar
            </Button>
            <Button
              onClick={() => navigate("/cadastros/depositos")}
              variant="outline"
              className="h-9 px-4 text-xs font-semibold bg-gray-800 text-white hover:bg-gray-900"
            >
              Voltar
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border p-6">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="dados" className="text-xs">
                Dados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-semibold">
                      Nome do depósito <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      maxLength={100}
                      placeholder="Digite o nome do depósito"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-xs font-semibold">
                      Empresa <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.company_id}
                      onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                      required
                    >
                      <SelectTrigger id="company" className="text-xs">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id} className="text-xs">
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
