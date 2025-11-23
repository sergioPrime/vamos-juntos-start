import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { CountUpNumber } from "@/components/animations/CountUpNumber"

interface MetricCardProps {
  title: string
  value: number
  icon: LucideIcon
  growth?: number
  format?: 'number' | 'currency' | 'percentage'
  description?: string
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  growth, 
  format = 'number',
  description 
}: MetricCardProps) {
  const isPositiveGrowth = growth !== undefined && growth >= 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <CountUpNumber 
            value={value} 
            format={format}
            duration={1000}
          />
        </div>
        {growth !== undefined && (
          <p className={`text-xs ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveGrowth ? '+' : ''}{growth.toFixed(1)}% vs. 30 dias atrás
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
