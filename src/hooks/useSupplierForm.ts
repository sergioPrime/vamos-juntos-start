import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';

export interface SupplierFormData {
  // A) Basic Data
  supplier_type: 'legal' | 'individual';
  legal_name?: string;
  trade_name?: string;
  full_name?: string;
  document: string;
  state_registration?: string;
  municipal_registration?: string;
  cnae_code?: string;
  business_activity?: string;
  status: 'active' | 'inactive' | 'blocked';
  
  // B) Contacts
  main_contact_name?: string;
  landline_phone?: string;
  mobile_phone?: string;
  whatsapp_phone?: string;
  email?: string;
  billing_email?: string;
  website_url?: string;
  
  // C) Address
  zip_code?: string;
  street_type?: string;
  street_name?: string;
  street_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  
  // D) Financial and Commercial
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  pix_key?: string;
  default_payment_terms?: string;
  credit_limit?: number;
  average_delivery_time?: string;
  commercial_notes?: string;
  
  // E) Documentation
  general_observations?: string;
}

export const useSupplierForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const form = useForm<SupplierFormData>({
    defaultValues: {
      supplier_type: 'legal',
      status: 'active',
      country: 'BR',
    },
  });

  const validateDocument = (document: string, type: 'legal' | 'individual') => {
    if (!document) return false;
    
    const cleanDoc = document.replace(/\D/g, '');
    
    if (type === 'legal') {
      // CNPJ validation
      return cleanDoc.length === 14;
    } else {
      // CPF validation
      return cleanDoc.length === 11;
    }
  };

  const formatDocument = (value: string, type: 'legal' | 'individual') => {
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'legal') {
      // CNPJ format: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else {
      // CPF format: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  };

  const searchAddressByCEP = async (cep: string) => {
    try {
      const cleanCEP = cep.replace(/\D/g, '');
      if (cleanCEP.length !== 8) return;

      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (!data.erro) {
        form.setValue('street_name', data.logradouro);
        form.setValue('neighborhood', data.bairro);
        form.setValue('city', data.localidade);
        form.setValue('state', data.uf);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const createSupplier = async (data: SupplierFormData) => {
    if (!currentOrg?.id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    try {
      const supplierData = {
        ...data,
        org_id: currentOrg.id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        name: data.supplier_type === 'legal' ? (data.legal_name || data.trade_name) : data.full_name,
      };

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso",
      });

      return supplier;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar fornecedor",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSupplier = async (id: string, data: SupplierFormData) => {
    setIsLoading(true);
    try {
      const supplierData = {
        ...data,
        name: data.supplier_type === 'legal' ? (data.legal_name || data.trade_name) : data.full_name,
      };

      const { data: supplier, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso",
      });

      return supplier;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar fornecedor",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    createSupplier,
    updateSupplier,
    validateDocument,
    formatDocument,
    searchAddressByCEP,
  };
};