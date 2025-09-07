import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "./useOrganization"
import { useToast } from "@/hooks/use-toast"

export interface CostCenter {
  id: string
  org_id: string
  code: string
  name: string
  description?: string
  is_active: boolean
  parent_id?: string
  created_at: string
  updated_at: string
  children?: CostCenter[]
}

export interface CreateCostCenterData {
  code: string
  name: string
  description?: string
  parent_id?: string
}

export function useCostCenters() {
  const organization = useOrganization()
  const { toast } = useToast()
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadCostCenters()
    }
  }, [organization])

  const loadCostCenters = async () => {
    if (!organization?.currentOrg?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("cost_centers" as any)
        .select("*")
        .eq("org_id", organization.currentOrg.id)
        .eq("is_active", true)
        .order("code", { ascending: true })

      if (error) throw error
      
      // Build hierarchical structure
      const centersMap = new Map<string, CostCenter>()
      const rootCenters = [] as CostCenter[]

      // First pass: create map of all centers
      (data as any)?.forEach((center: any) => {
        centersMap.set(center.id, { ...center, children: [] as CostCenter[] })
      })

      // Second pass: build hierarchy
      (data as any)?.forEach((center: any) => {
        const centerWithChildren = centersMap.get(center.id)!
        if (center.parent_id && centersMap.has(center.parent_id)) {
          const parent = centersMap.get(center.parent_id)!
          parent.children!.push(centerWithChildren)
        } else {
          rootCenters.push(centerWithChildren)
        }
      })

      setCostCenters(rootCenters)
    } catch (error) {
      console.error("Error loading cost centers:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar centros de custo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createCostCenter = async (data: CreateCostCenterData): Promise<boolean> => {
    if (!organization?.currentOrg?.id) return false

    try {
      const { error } = await supabase
        .from("cost_centers" as any)
        .insert([{
          ...data,
          org_id: organization.currentOrg.id,
        }])

      if (error) throw error

      await loadCostCenters()
      toast({
        title: "Sucesso",
        description: "Centro de custo criado com sucesso",
      })
      return true
    } catch (error) {
      console.error("Error creating cost center:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar centro de custo",
        variant: "destructive",
      })
      return false
    }
  }

  const updateCostCenter = async (id: string, data: Partial<CreateCostCenterData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("cost_centers" as any)
        .update(data)
        .eq("id", id)

      if (error) throw error

      await loadCostCenters()
      toast({
        title: "Sucesso",
        description: "Centro de custo atualizado com sucesso",
      })
      return true
    } catch (error) {
      console.error("Error updating cost center:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar centro de custo",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteCostCenter = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("cost_centers" as any)
        .update({ is_active: false })
        .eq("id", id)

      if (error) throw error

      await loadCostCenters()
      toast({
        title: "Sucesso",
        description: "Centro de custo desativado com sucesso",
      })
      return true
    } catch (error) {
      console.error("Error deleting cost center:", error)
      toast({
        title: "Erro",
        description: "Erro ao desativar centro de custo",
        variant: "destructive",
      })
      return false
    }
  }

  const getFlatCostCenters = (): CostCenter[] => {
    const flatten = (centers: CostCenter[]): CostCenter[] => {
      let result: CostCenter[] = []
      centers.forEach(center => {
        result.push(center)
        if (center.children && center.children.length > 0) {
          result = result.concat(flatten(center.children))
        }
      })
      return result
    }
    return flatten(costCenters)
  }

  return {
    costCenters,
    loading,
    loadCostCenters,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter,
    getFlatCostCenters,
  }
}