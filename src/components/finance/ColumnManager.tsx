import { useState } from "react"
import { Settings, Check, GripVertical, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAnimation } from "@/contexts/AnimationContext"
import { cn } from "@/lib/utils"

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width?: number
  sortable?: boolean
  required?: boolean
}

interface ColumnManagerProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
  onSavePreferences?: () => void
}

export function ColumnManager({ columns, onColumnsChange, onSavePreferences }: ColumnManagerProps) {
  const { animationsEnabled } = useAnimation()
  const [open, setOpen] = useState(false)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const visibleCount = columns.filter(col => col.visible).length
  const totalCount = columns.length

  const handleToggleColumn = (columnKey: string) => {
    const updatedColumns = columns.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    )
    onColumnsChange(updatedColumns)
  }

  const handleShowAll = () => {
    const updatedColumns = columns.map(col => ({ ...col, visible: true }))
    onColumnsChange(updatedColumns)
  }

  const handleHideAll = () => {
    const updatedColumns = columns.map(col => ({ 
      ...col, 
      visible: false
    }))
    onColumnsChange(updatedColumns)
  }

  const handleResetToDefault = () => {
    const defaultColumns = columns.map(col => ({
      ...col,
      visible: ['status', 'entry_code', 'company_name', 'due_date', 'entry_type', 'amount', 'settled_amount', 'balance', 'person_name', 'chart_of_account'].includes(col.key)
    }))
    onColumnsChange(defaultColumns)
  }

  const handleDragStart = (index: number) => {
    setDraggedItem(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedItem === null) return

    const newColumns = [...columns]
    const draggedColumn = newColumns[draggedItem]
    newColumns.splice(draggedItem, 1)
    newColumns.splice(index, 0, draggedColumn)
    
    setDraggedItem(index)
    onColumnsChange(newColumns)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleApply = () => {
    onSavePreferences?.()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 transition-all duration-200",
            animationsEnabled && "hover:scale-105"
          )}
        >
          <Settings className="h-4 w-4" />
          Colunas ({visibleCount}/{totalCount})
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 bg-background border z-50" 
        align="end"
        side="bottom"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Gerenciar Colunas</h4>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowAll}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHideAll}
                className="h-7 px-2 text-xs"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Ocultar
              </Button>
            </div>
          </div>

          <ScrollArea className="h-80">
            <div className="space-y-1">
              {columns.map((column, index) => (
                <div
                  key={column.key}
                  draggable={true}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border transition-all duration-150",
                    "hover:bg-muted/50 cursor-pointer",
                    draggedItem === index && "opacity-50",
                    animationsEnabled && "hover:scale-[1.02]"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  
                  <Checkbox
                    id={`column-${column.key}`}
                    checked={column.visible}
                    onCheckedChange={() => handleToggleColumn(column.key)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  
                  <Label
                    htmlFor={`column-${column.key}`}
                    className={cn(
                      "flex-1 text-sm cursor-pointer",
                      !column.visible && "text-muted-foreground"
                    )}
                  >
                    {column.label}
                  </Label>

                  {column.visible && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator className="my-4" />
          
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              className="text-xs"
            >
              Restaurar Padrão
            </Button>
            
            <Button
              size="sm"
              onClick={handleApply}
              className={cn(
                "text-xs gap-1",
                animationsEnabled && "hover:scale-105"
              )}
            >
              <Check className="h-3 w-3" />
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}