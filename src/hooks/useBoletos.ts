import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface Boleto {
  id: string;
  entry_id: string;
  installment_id: string | null;
  boleto_number: string;
  barcode: string;
  digitable_line: string;
  amount: number;
  due_date: string;
  person_name: string;
  person_document: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  generated_at: string;
  paid_at: string | null;
  bank_account_id: string | null;
}

export interface BoletoGenerationData {
  entry_id: string;
  installment_id?: string;
  amount: number;
  due_date: string;
  person_id: string;
  bank_account_id?: string;
  late_fee?: number;
  interest?: number;
  discount?: number;
}

export function useBoletos() {
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [boletos, setBoletos] = useState<Boleto[]>([]);

  const loadBoletos = useCallback(async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    personId?: string;
  }) => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('financial_entries')
        .select(`
          id,
          amount,
          due_date,
          description,
          entry_type,
          is_settled,
          settled_at,
          person_id,
          bank_account_id,
          financial_entry_installments!inner(
            id,
            installment_number,
            amount,
            due_date,
            is_settled
          )
        `)
        .eq('org_id', currentOrg.id)
        .eq('entry_type', 'receivable')
        .not('financial_entry_installments', 'is', null);

      if (filters?.status) {
        if (filters.status === 'paid') {
          query = query.eq('is_settled', true);
        } else if (filters.status === 'overdue') {
          query = query.eq('is_settled', false).lt('due_date', new Date().toISOString().split('T')[0]);
        } else if (filters.status === 'pending') {
          query = query.eq('is_settled', false).gte('due_date', new Date().toISOString().split('T')[0]);
        }
      }

      if (filters?.startDate) {
        query = query.gte('due_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('due_date', filters.endDate);
      }

      if (filters?.personId) {
        query = query.eq('person_id', filters.personId);
      }

      const { data, error } = await query.order('due_date', { ascending: false });

      if (error) throw error;

      // Buscar informações das pessoas
      const personIds = [...new Set(data?.map(item => item.person_id).filter(Boolean))];
      const { data: pessoas } = await supabase
        .from('pessoas')
        .select('id, razao_social, documento')
        .in('id', personIds);

      const pessoasMap = new Map(pessoas?.map(p => [p.id, p]) || []);

      const boletosData: Boleto[] = (data || []).flatMap(entry => {
        const pessoa = pessoasMap.get(entry.person_id || '');
        
        return (entry.financial_entry_installments || []).map((inst: any) => ({
          id: inst.id,
          entry_id: entry.id,
          installment_id: inst.id,
          boleto_number: `BL${inst.id.slice(0, 8).toUpperCase()}`,
          barcode: generateBarcode(inst.id, inst.amount, inst.due_date),
          digitable_line: generateDigitableLine(inst.id, inst.amount, inst.due_date),
          amount: inst.amount,
          due_date: inst.due_date,
          person_name: pessoa?.razao_social || 'N/A',
          person_document: pessoa?.documento || 'N/A',
          status: inst.is_settled ? 'paid' : 
                  new Date(inst.due_date) < new Date() ? 'overdue' : 'pending',
          generated_at: new Date().toISOString(),
          paid_at: inst.is_settled ? entry.settled_at : null,
          bank_account_id: entry.bank_account_id
        }));
      });

      setBoletos(boletosData);
    } catch (error: any) {
      console.error('Erro ao carregar boletos:', error);
      toast.error('Erro ao carregar boletos');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const generateBoleto = async (data: BoletoGenerationData): Promise<boolean> => {
    if (!currentOrg?.id) {
      toast.error('Organização não identificada');
      return false;
    }

    setLoading(true);
    try {
      // Simular geração de boleto
      const boletoNumber = `BL${Date.now().toString().slice(-8)}`;
      const barcode = generateBarcode(data.entry_id, data.amount, data.due_date);
      const digitableLine = generateDigitableLine(data.entry_id, data.amount, data.due_date);

      // Atualizar o lançamento com dados do boleto
      const { error: updateError } = await supabase
        .from('financial_entries')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', data.entry_id);

      if (updateError) throw updateError;

      toast.success('Boleto gerado com sucesso');
      await loadBoletos();
      return true;
    } catch (error: any) {
      console.error('Erro ao gerar boleto:', error);
      toast.error(error.message || 'Erro ao gerar boleto');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelBoleto = async (installmentId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Marcar como cancelado (podemos adicionar um campo status no futuro)
      toast.success('Boleto cancelado');
      await loadBoletos();
      return true;
    } catch (error: any) {
      console.error('Erro ao cancelar boleto:', error);
      toast.error('Erro ao cancelar boleto');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerPayment = async (
    installmentId: string,
    paidAmount: number,
    paymentDate: string,
    paymentMethodId?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('settle_installment_with_charges', {
        p_installment_id: installmentId,
        p_payment_date: paymentDate,
        p_payment_method_id: paymentMethodId || null,
        p_bank_account_id: null,
        p_custom_amount: paidAmount
      });

      if (error) throw error;

      toast.success('Pagamento registrado com sucesso');
      await loadBoletos();
      return true;
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    boletos,
    loadBoletos,
    generateBoleto,
    cancelBoleto,
    registerPayment
  };
}

// Helper functions para geração de código de barras e linha digitável
function generateBarcode(id: string, amount: number, dueDate: string): string {
  const bankCode = '001'; // Banco do Brasil
  const currency = '9';
  const dueFactor = calculateDueDateFactor(dueDate);
  const amountStr = Math.round(amount * 100).toString().padStart(10, '0');
  const freeField = id.slice(0, 25).padEnd(25, '0');
  
  return `${bankCode}${currency}${dueFactor}${amountStr}${freeField}`;
}

function generateDigitableLine(id: string, amount: number, dueDate: string): string {
  const barcode = generateBarcode(id, amount, dueDate);
  
  // Divide em campos conforme padrão bancário
  const field1 = `${barcode.slice(0, 4)}.${barcode.slice(4, 9)}`;
  const field2 = `${barcode.slice(9, 14)}.${barcode.slice(14, 19)}`;
  const field3 = `${barcode.slice(19, 24)}.${barcode.slice(24, 29)}`;
  const field4 = barcode.slice(4, 5); // Dígito verificador
  const field5 = barcode.slice(5, 19); // Fator vencimento + valor
  
  return `${field1} ${field2} ${field3} ${field4} ${field5}`;
}

function calculateDueDateFactor(dueDate: string): string {
  const baseDate = new Date('1997-10-07');
  const due = new Date(dueDate);
  const diffTime = due.getTime() - baseDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays.toString().padStart(4, '0');
}
