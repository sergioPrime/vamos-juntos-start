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
    <div className="min-h-screen bg-[#e8e8e8]">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded" style={{ backgroundColor: "#20b5d5" }}>
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] text-gray-600 mb-0.5">Cadastro &gt;</p>
              <h1 className="text-[22px] font-normal text-gray-900">
                Cadastro de Depósito
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="h-10 px-5 text-sm font-medium bg-[#20b5d5] hover:bg-[#1a9ab8] text-white"
            >
              Salvar
            </Button>
            <Button
              onClick={() => navigate("/cadastros/depositos")}
              className="h-10 px-5 text-sm font-medium bg-black hover:bg-gray-800 text-white"
            >
              Voltar
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded border border-gray-200">
          {/* Tab Header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-gray-900">Dados</span>
              <svg className="h-3 w-3 text-[#20b5d5]" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1L6 11M1 6L11 6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[13px] font-semibold text-gray-900">
                  Nome do depósito <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={100}
                  placeholder=""
                  className="text-sm h-10 border-gray-300"
                  required
                  uppercase
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-[13px] font-semibold text-gray-900">
                  Empresa <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                  required
                >
                  <SelectTrigger id="company" className="text-sm h-10 border-gray-300">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id} className="text-sm">
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
