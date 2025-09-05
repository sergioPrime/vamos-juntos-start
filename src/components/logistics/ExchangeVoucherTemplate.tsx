import { RotateCcw, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface ExchangeVoucherTemplateProps {
  orderNumber: string
  totalAmount: number
  onPrint: () => void
}

export const ExchangeVoucherTemplate = ({
  orderNumber,
  totalAmount,
  onPrint
}: ExchangeVoucherTemplateProps) => {
  const today = new Date()
  const expiryDate = new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000)) // 60 days
  
  const voucherCode = `TRC-${orderNumber}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  return (
    <div className="space-y-6">
      {/* Print Options */}
      <div className="flex gap-2 no-print">
        <Button onClick={onPrint} className="btn-action-primary">
          Imprimir Cupom
        </Button>
        <Button variant="outline" onClick={onPrint}>
          Imprimir Comprovante
        </Button>
      </div>

      {/* Voucher Template */}
      <Card className="print:shadow-none print:border-2 print:border-dashed">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                <RotateCcw className="h-6 w-6" />
                CUPOM DE TROCA
              </h2>
              <Badge variant="outline" className="mt-2">
                Válido por 60 dias
              </Badge>
            </div>

            <Separator className="border-dashed" />

            {/* Company Info */}
            <div className="text-center">
              <h3 className="font-bold text-lg">SUA EMPRESA LTDA</h3>
              <p className="text-sm text-muted-foreground">
                Rua da Empresa, 456 - Centro - São Paulo/SP<br />
                Telefone: (11) 99999-9999 | Email: contato@empresa.com
              </p>
            </div>

            <Separator className="border-dashed" />

            {/* Voucher Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">CÓDIGO DO CUPOM</p>
                    <p className="font-mono font-bold text-lg">{voucherCode}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">VALOR PARA TROCA</p>
                    <p className="font-bold text-xl text-primary">R$ {totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">PEDIDO ORIGINAL</p>
                    <p className="font-semibold">{orderNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">VÁLIDO ATÉ</p>
                    <p className="font-semibold">{expiryDate.toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="border-dashed" />

            {/* Terms and Conditions */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4" />
                TERMOS E CONDIÇÕES DE TROCA
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Este cupom é válido por 60 dias corridos a partir da data de emissão</li>
                <li>• A troca poderá ser realizada somente na loja onde foi efetuada a compra</li>
                <li>• O produto deve estar em perfeitas condições, na embalagem original</li>
                <li>• Apresentar este cupom no ato da troca</li>
                <li>• Caso o valor do novo produto seja inferior, não há devolução em dinheiro</li>
                <li>• Caso o valor seja superior, a diferença deverá ser paga no ato</li>
                <li>• Este cupom não é transferível e não pode ser convertido em dinheiro</li>
                <li>• A troca está sujeita à disponibilidade de estoque</li>
              </ul>
            </div>

            <Separator className="border-dashed" />

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Emitido em: {today.toLocaleDateString('pt-BR')} às {today.toLocaleTimeString('pt-BR')}<br />
                Cupom gerado automaticamente pelo sistema
              </p>
            </div>

            {/* Cut line */}
            <div className="text-center border-t border-dashed pt-2">
              <p className="text-xs text-muted-foreground">✂️ RECORTE AQUI ✂️</p>
            </div>

            {/* Customer Copy */}
            <div className="bg-muted/20 p-4 rounded-lg">
              <div className="text-center">
                <h4 className="font-semibold">VIA DO CLIENTE</h4>
                <p className="text-sm mt-2">
                  Código: <span className="font-mono font-bold">{voucherCode}</span><br />
                  Valor: <span className="font-bold">R$ {totalAmount.toFixed(2)}</span><br />
                  Válido até: <span className="font-semibold">{expiryDate.toLocaleDateString('pt-BR')}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none, .print\\:shadow-none * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  )
}