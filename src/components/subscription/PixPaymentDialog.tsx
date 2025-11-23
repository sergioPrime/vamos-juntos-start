import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Copy, CheckCircle2, Clock, QrCode } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PixPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  planName: string
  billingCycle: "monthly" | "annual"
}

export function PixPaymentDialog({
  open,
  onOpenChange,
  planId,
  planName,
  billingCycle,
}: PixPaymentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pixData, setPixData] = useState<{
    qrCode: string
    code: string
    expiresAt: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    postalCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  })

  const handleGeneratePix = async () => {
    if (!formData.name || !formData.document || !formData.postalCode || 
        !formData.street || !formData.number || !formData.city || !formData.state) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Não autenticado")

      const { data, error } = await supabase.functions.invoke("create-pix-payment", {
        body: {
          planId,
          billingCycle,
          customerName: formData.name,
          customerDocument: formData.document.replace(/\D/g, ""),
          customerAddress: {
            line1: `${formData.street}, ${formData.number}`,
            line2: formData.complement || "",
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode.replace(/\D/g, ""),
          },
        },
      })

      if (error) throw error

      setPixData({
        qrCode: data.pixQrCode,
        code: data.pixCode,
        expiresAt: data.expiresAt,
      })

      toast({
        title: "PIX gerado com sucesso!",
        description: "Escaneie o QR Code ou copie o código para pagar",
      })
    } catch (error) {
      console.error("Error generating PIX:", error)
      toast({
        title: "Erro ao gerar PIX",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPixCode = () => {
    if (pixData?.code) {
      navigator.clipboard.writeText(pixData.code)
      setCopied(true)
      toast({
        title: "Código copiado!",
        description: "Cole o código no app do seu banco",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  const formatPostalCode = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            {planName} - {billingCycle === "annual" ? "Anual" : "Mensal"}
          </DialogDescription>
        </DialogHeader>

        {!pixData ? (
          <div className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Preencha seus dados para gerar o código PIX. O código expira em 1 hora.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF/CNPJ *</Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: formatDocument(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={18}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">CEP *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: formatPostalCode(e.target.value) })}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Centro"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Rua Principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apto 101"
                />
              </div>
            </div>

            <Button onClick={handleGeneratePix} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando PIX...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Gerar PIX
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                PIX gerado com sucesso! Escaneie o QR Code ou copie o código.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center space-y-4">
              {pixData.qrCode && (
                <div className="bg-white p-4 rounded-lg">
                  <img src={pixData.qrCode} alt="QR Code PIX" className="w-64 h-64" />
                </div>
              )}

              <div className="w-full space-y-2">
                <Label>Código PIX (Copia e Cola)</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixData.code}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPixCode}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Este PIX expira em: {new Date(pixData.expiresAt).toLocaleString("pt-BR")}
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground text-center">
                Após o pagamento, sua assinatura será ativada automaticamente em alguns minutos.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
