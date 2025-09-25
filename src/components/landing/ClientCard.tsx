import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Quote } from "lucide-react"

interface ClientProps {
  id: string
  name: string
  logo: string
  description: string
  sector: string
  testimonial?: string
  results?: string
  website?: string
}

interface ClientCardProps {
  client: ClientProps
  className?: string
  style?: React.CSSProperties
}

export function ClientCard({ client, className, style }: ClientCardProps) {
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md ${className}`} style={style}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-xl overflow-hidden">
            {client.logo ? (
              <img 
                src={client.logo} 
                alt={`Logo ${client.name}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Building2 className="h-8 w-8 text-muted-foreground hidden" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{client.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {client.sector}
            </Badge>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {client.description}
        </p>
        
        {client.testimonial && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <Quote className="h-4 w-4 text-primary mb-2" />
            <p className="text-sm italic text-muted-foreground">
              "{client.testimonial}"
            </p>
          </div>
        )}
        
        {client.results && (
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-sm font-medium text-primary">
              {client.results}
            </span>
            <Badge variant="outline" className="text-xs">
              Case de Sucesso
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export type { ClientProps }