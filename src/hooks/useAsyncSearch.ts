import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'

interface SearchResult {
  id: string
  name: string
  code?: string
}

export const useAsyncSearch = () => {
  const organization = useOrganization()

  const searchCompanies = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!organization?.currentOrg?.id) return []
    
    let queryBuilder = supabase
      .from('companies')
      .select('id, name')
      .eq('org_id', organization.currentOrg.id)
      .eq('is_active', true)
    
    // Se query não está vazia, filtra por nome
    if (query.length >= 2) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`)
    }
    
    const { data } = await queryBuilder.limit(10)
    
    return data?.map(item => ({ id: item.id, name: item.name })) || []
  }, [organization?.currentOrg?.id])

  const searchBankAccounts = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!organization?.currentOrg?.id || query.length < 2) return []
    
    const { data } = await supabase
      .from('bank_accounts')
      .select('id, bank_name, account_number')
      .eq('org_id', organization.currentOrg.id)
      .eq('is_active', true)
      .or(`bank_name.ilike.%${query}%,account_number.ilike.%${query}%`)
      .limit(10)
    
    return data?.map(item => ({ 
      id: item.id, 
      name: `${item.bank_name} - ${item.account_number}` 
    })) || []
  }, [organization?.currentOrg?.id])

  const searchChartOfAccounts = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!organization?.currentOrg?.id || query.length < 2) return []
    
    const { data } = await supabase
      .from('chart_of_accounts')
      .select('id, account_name, account_code')
      .eq('org_id', organization.currentOrg.id)
      .eq('is_active', true)
      .eq('account_type', 'analytic')
      .or(`account_name.ilike.%${query}%,account_code.ilike.%${query}%`)
      .limit(10)
    
    return data?.map(item => ({ 
      id: item.id, 
      name: `${item.account_code} - ${item.account_name}`,
      code: item.account_code
    })) || []
  }, [organization?.currentOrg?.id])

  const searchPessoas = useCallback(async (query: string, type: 'cliente' | 'fornecedor'): Promise<SearchResult[]> => {
    if (!organization?.currentOrg?.id || query.length < 2) return []
    
    // Capitalize first letter to match database values
    const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1)
    
    const { data } = await supabase
      .from('pessoas')
      .select('id, nome_fantasia, codigo')
      .eq('org_id', organization.currentOrg.id)
      .eq('ativo', true)
      .contains('rotulos', [typeCapitalized])
      .or(`nome_fantasia.ilike.%${query}%,codigo.ilike.%${query}%`)
      .limit(10)
    
    return data?.map(item => ({ 
      id: item.id, 
      name: item.nome_fantasia,
      code: item.codigo
    })) || []
  }, [organization?.currentOrg?.id])

  const searchPaymentMethods = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!organization?.currentOrg?.id || query.length < 2) return []
    
    const { data } = await supabase
      .from('payment_methods')
      .select('id, name, code')
      .eq('org_id', organization.currentOrg.id)
      .eq('active', true)
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .limit(10)
    
    return data?.map(item => ({ 
      id: item.id, 
      name: item.name,
      code: item.code
    })) || []
  }, [organization?.currentOrg?.id])

  const searchCostCenters = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!organization?.currentOrg?.id || query.length < 2) return []
    
    const { data } = await supabase
      .from('cost_centers')
      .select('id, name, code')
      .eq('org_id', organization.currentOrg.id)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .limit(10)
    
    return data?.map(item => ({ 
      id: item.id, 
      name: `${item.code} - ${item.name}`,
      code: item.code
    })) || []
  }, [organization?.currentOrg?.id])

  return {
    searchCompanies,
    searchBankAccounts,
    searchChartOfAccounts,
    searchPessoas,
    searchPaymentMethods,
    searchCostCenters
  }
}