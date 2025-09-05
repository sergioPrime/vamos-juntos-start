import { QrCode, Package, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ShippingLabelTemplateProps {
  orderNumber: string
  customerAddress: string
  onPrint: () => void
}

export const ShippingLabelTemplate = ({
  orderNumber,
  customerAddress,
  onPrint
}: ShippingLabelTemplateProps) => {
  const today = new Date().toLocaleDateString('pt-BR')
  const qrCodeData = `ORDER:${orderNumber}|DATE:${today}`

  return (
    <div className="space-y-6">
      {/* Print Options */}
      <div className="flex gap-2 no-print">
        <Button onClick={onPrint} className="btn-action-primary">
          Imprimir A4
        </Button>
        <Button variant="outline" onClick={onPrint}>
          Imprimir 100x150mm
        </Button>
      </div>

      {/* Label Template */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold">ETIQUETA DE EXPEDIÇÃO</h2>
              <p className="text-lg text-muted-foreground">Pedido #{orderNumber}</p>
            </div>

            <Separator />

            {/* Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  REMETENTE
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Sua Empresa LTDA</p>
                  <p>Rua da Empresa, 456</p>
                  <p>Centro - São Paulo/SP</p>
                  <p>CEP: 01234-567</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Phone className="h-3 w-3" />
                    <span>(11) 99999-9999</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>contato@empresa.com</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  DESTINATÁRIO
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Cliente da Silva</p>
                  <p>{customerAddress}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Phone className="h-3 w-3" />
                    <span>(11) 88888-8888</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">PESO</p>
                <p className="font-semibold">2,5 kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VOLUMES</p>
                <p className="font-semibold">1</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MODALIDADE</p>
                <p className="font-semibold">PAC</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">VALOR</p>
                <p className="font-semibold">R$ 15,00</p>
              </div>
            </div>

            <Separator />

            {/* Tracking and QR Code */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold mb-2">CÓDIGO DE RASTREAMENTO</h3>
                <p className="text-xl font-mono font-bold">BR123456789BR</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Data de postagem: {today}
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 border-2 border-dashed border-muted-foreground flex items-center justify-center">
                  <QrCode className="h-16 w-16" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">QR Code</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-muted/30 p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">INSTRUÇÕES ESPECIAIS:</h4>
              <p className="text-xs text-muted-foreground">
                • Produto frágil - manuseie com cuidado<br />
                • Entrega somente ao destinatário<br />
                • Horário comercial: 8h às 18h
              </p>
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