import { useState } from "react"
import { Percent, DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface DiscountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentValue: number
  onApply: (discountValue: number, isPercentage: boolean) => void
  title?: string
}

export const DiscountDialog = ({
  open,
  onOpenChange,
  currentValue,
  onApply,
  title = "Aplicar Desconto"
}: DiscountDialogProps) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'value'>('percentage')
  const [discountValue, setDiscountValue] = useState(0)

  const handleApply = () => {
    onApply(discountValue, discountType === 'percentage')
    onOpenChange(false)
    setDiscountValue(0)
  }

  const calculatedDiscount = discountType === 'percentage'
    ? (currentValue * discountValue) / 100
    : discountValue

  const finalValue = currentValue - calculatedDiscount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title} (F5)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tipo de Desconto</Label>
            <RadioGroup
              value={discountType}
              onValueChange={(value) => setDiscountType(value as 'percentage' | 'value')}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="flex items-center gap-2 cursor-pointer">
                  <Percent className="h-4 w-4" />
                  Percentual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="value" id="value" />
                <Label htmlFor="value" className="flex items-center gap-2 cursor-pointer">
                  <DollarSign className="h-4 w-4" />
                  Valor Fixo
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>
              {discountType === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
            </Label>
            <Input
              type="number"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className="text-right font-mono text-lg"
              autoFocus
            />
          </div>

          <div className="p-4 bg-accent/50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Original:</span>
              <span className="font-medium">
                {currentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Desconto:</span>
              <span className="font-medium text-orange-600">
                - {calculatedDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Valor Final:</span>
              <span className="font-bold text-lg text-green-600">
                {finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={discountValue <= 0}>
            Aplicar Desconto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
