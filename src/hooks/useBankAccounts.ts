import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { useToast } from './use-toast';

export interface BankAccount {
  id: string;
  org_id: string;
  company_id?: string;
  bank_name: string;
  bank_code?: string;
  account_number: string;
  agency?: string;
  agency_digit?: string;
  account_digit?: string;
  account_type: string;
  balance: number;
  is_active: boolean;
  emit_boletos_erp: boolean;
  enable_pix_sales: boolean;
  initial_number: number;
  monthly_interest: number;
  fine_percentage: number;
  discount_until_due: number;
  emit_with_receipt: boolean;
  payment_instruction_after_due?: string;
  bank_can_protest: boolean;
  bank_can_return: boolean;
  created_at: string;
  updated_at: string;
  companies?: {
    id: string;
    name: string;
  };
}

export interface BankWallet {
  id: string;
  bank_account_id: string;
  org_id: string;
  name: string;
  agreement_number?: string;
  fee: number;
  add_fee_to_amount: boolean;
  with_registration: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  company_id: string;
  bank_name: string;
  bank_code?: string;
  account_number: string;
  agency?: string;
  agency_digit?: string;
  account_digit?: string;
  account_type: string;
  balance?: number;
  emit_boletos_erp?: boolean;
  enable_pix_sales?: boolean;
  initial_number?: number;
  monthly_interest?: number;
  fine_percentage?: number;
  discount_until_due?: number;
  emit_with_receipt?: boolean;
  payment_instruction_after_due?: string;
  bank_can_protest?: boolean;
  bank_can_return?: boolean;
}

export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrg } = useOrganization();
  const { toast } = useToast();

  const loadAccounts = async () => {
    if (!currentOrg?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts((data as any) || []);
    } catch (error: any) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas bancárias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (data: CreateBankAccountData) => {
    if (!currentOrg?.id) return null;

    try {
      const { data: newAccount, error } = await supabase
        .from('bank_accounts')
        .insert({
          ...data,
          org_id: currentOrg.id,
          balance: data.balance || 0,
          emit_boletos_erp: data.emit_boletos_erp || false,
          enable_pix_sales: data.enable_pix_sales || false,
          initial_number: data.initial_number || 0,
          monthly_interest: data.monthly_interest || 0,
          fine_percentage: data.fine_percentage || 0,
          discount_until_due: data.discount_until_due || 0,
          emit_with_receipt: data.emit_with_receipt || false,
          bank_can_protest: data.bank_can_protest || false,
          bank_can_return: data.bank_can_return || false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta bancária criada com sucesso",
      });

      await loadAccounts();
      return newAccount;
    } catch (error: any) {
      console.error('Error creating bank account:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar conta bancária",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAccount = async (id: string, data: Partial<CreateBankAccountData>) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta bancária atualizada com sucesso",
      });

      await loadAccounts();
      return true;
    } catch (error: any) {
      console.error('Error updating bank account:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar conta bancária",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleAccountStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Conta ${isActive ? 'ativada' : 'desativada'} com sucesso`,
      });

      await loadAccounts();
      return true;
    } catch (error: any) {
      console.error('Error toggling account status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da conta",
        variant: "destructive",
      });
      return false;
    }
  };

  const getFormattedAccountName = (account: BankAccount) => {
    const bankInfo = account.bank_code ? `${account.bank_code} ${account.bank_name}` : account.bank_name;
    const accountInfo = account.agency && account.account_number 
      ? `Ag ${account.agency}${account.agency_digit ? `-${account.agency_digit}` : ''} / Cc ${account.account_number}${account.account_digit ? `-${account.account_digit}` : ''}`
      : account.account_number;
    
    return `${bankInfo} - ${accountInfo}`;
  };

  const getActiveAccounts = () => {
    return accounts.filter(account => account.is_active);
  };

  useEffect(() => {
    loadAccounts();
  }, [currentOrg?.id]);

  return {
    accounts,
    loading,
    loadAccounts,
    createAccount,
    updateAccount,
    toggleAccountStatus,
    getFormattedAccountName,
    getActiveAccounts,
  };
}

// Hook for managing bank wallets
export function useBankWallets(bankAccountId?: string) {
  const [wallets, setWallets] = useState<BankWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrg } = useOrganization();
  const { toast } = useToast();

  const loadWallets = async () => {
    if (!currentOrg?.id || !bankAccountId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_wallets')
        .select('*')
        .eq('bank_account_id', bankAccountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (error: any) {
      console.error('Error loading bank wallets:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar carteiras",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async (walletData: {
    name: string;
    agreement_number?: string;
    fee?: number;
    add_fee_to_amount?: boolean;
    with_registration?: boolean;
    is_default?: boolean;
  }) => {
    if (!currentOrg?.id || !bankAccountId) return null;

    try {
      // If setting as default, unset other defaults first
      if (walletData.is_default) {
        await supabase
          .from('bank_wallets')
          .update({ is_default: false })
          .eq('bank_account_id', bankAccountId);
      }

      const { data: newWallet, error } = await supabase
        .from('bank_wallets')
        .insert({
          ...walletData,
          bank_account_id: bankAccountId,
          org_id: currentOrg.id,
          fee: walletData.fee || 0,
          add_fee_to_amount: walletData.add_fee_to_amount || false,
          with_registration: walletData.with_registration || false,
          is_default: walletData.is_default || false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Carteira adicionada com sucesso",
      });

      await loadWallets();
      return newWallet;
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar carteira",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateWallet = async (id: string, data: Partial<BankWallet>) => {
    try {
      // If setting as default, unset other defaults first
      if (data.is_default && bankAccountId) {
        await supabase
          .from('bank_wallets')
          .update({ is_default: false })
          .eq('bank_account_id', bankAccountId);
      }

      const { error } = await supabase
        .from('bank_wallets')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Carteira atualizada com sucesso",
      });

      await loadWallets();
      return true;
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar carteira",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteWallet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Carteira removida com sucesso",
      });

      await loadWallets();
      return true;
    } catch (error: any) {
      console.error('Error deleting wallet:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover carteira",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (bankAccountId) {
      loadWallets();
    }
  }, [bankAccountId, currentOrg?.id]);

  return {
    wallets,
    loading,
    loadWallets,
    createWallet,
    updateWallet,
    deleteWallet,
  };
}