import { useState } from 'react';
import { toast } from 'sonner';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export const useViaCep = () => {
  const [loading, setLoading] = useState(false);

  const searchCep = async (cep: string): Promise<ViaCepResponse | null> => {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return null;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return null;
      }
      
      toast.success('Endereço encontrado!');
      return data;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Verifique sua conexão.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    searchCep,
    loading,
  };
};
