import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { createRoot } from 'react-dom/client'
import { DANFETemplate } from '@/components/fiscal/DANFETemplate'

export function usePrintDANFE() {
  const [isPrinting, setIsPrinting] = useState(false)

  const printDANFE = async (nfeId: string) => {
    try {
      setIsPrinting(true)

      // Buscar dados completos da NFe
      const { data: nfe, error: nfeError } = await supabase
        .from('nfe')
        .select(`
          *,
          pessoas:destinatario_id(nome, cpf_cnpj, email, telefone),
          companies:company_id(name, address, city, state, zip_code, document, phone, email)
        `)
        .eq('id', nfeId)
        .single()

      if (nfeError) throw nfeError

      // Buscar itens da NFe
      const { data: items, error: itemsError } = await supabase
        .from('nfe_items')
        .select('*')
        .eq('nfe_id', nfeId)
        .order('item_numero')

      if (itemsError) throw itemsError

      // Criar nova janela para impressão
      const printWindow = window.open('', '_blank')
      
      if (!printWindow) {
        toast.error('Bloqueador de pop-up detectado. Permita pop-ups para imprimir o DANFE.')
        return
      }

      // Criar documento HTML
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>DANFE - NFe ${nfe.numero}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; }
              @media print {
                @page { margin: 0.5cm; }
              }
            </style>
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `)
      printWindow.document.close()

      // Aguardar carregamento
      await new Promise(resolve => setTimeout(resolve, 100))

      // Renderizar componente React no documento
      const rootElement = printWindow.document.getElementById('root')
      if (rootElement) {
        const root = createRoot(rootElement)
        root.render(
          <DANFETemplate 
            nfe={nfe}
            items={items || []}
            emitente={nfe.companies}
            destinatario={nfe.pessoas}
          />
        )

        // Aguardar renderização e imprimir
        await new Promise(resolve => setTimeout(resolve, 500))
        printWindow.focus()
        printWindow.print()
      }

      toast.success('DANFE gerado com sucesso!')

    } catch (error: any) {
      console.error('Erro ao gerar DANFE:', error)
      toast.error('Erro ao gerar DANFE: ' + error.message)
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printDANFE,
    isPrinting
  }
}
