import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSalesPipeline } from "@/hooks/useSalesPipeline"
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from "react-beautiful-dnd"
import { TrendingUp, DollarSign, Calendar, User } from "lucide-react"

export default function SalesFunnel() {
  const { pipeline, opportunities, updateOpportunityStage, loading } = useSalesPipeline()

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const oppId = result.draggableId
    const newStage = result.destination.droppableId

    await updateOpportunityStage(oppId, newStage)
  }

  const getStageTotal = (stageId: string) => {
    return opportunities
      .filter(opp => opp.stage_id === stageId)
      .reduce((sum, opp) => sum + (opp.value || 0), 0)
  }

  const getStageColor = (index: number) => {
    const colors = [
      "bg-blue-100 border-blue-300",
      "bg-purple-100 border-purple-300",
      "bg-yellow-100 border-yellow-300",
      "bg-green-100 border-green-300",
    ]
    return colors[index % colors.length]
  }

  if (loading) {
    return <div className="p-6">Carregando funil de vendas...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Funil de Vendas</h1>
        <p className="text-muted-foreground">Acompanhe suas oportunidades em tempo real</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total em Negociação</p>
              <p className="text-2xl font-bold">
                R$ {opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold">
                R$ {opportunities.length > 0 
                  ? Math.round(opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0) / opportunities.length).toLocaleString('pt-BR')
                  : 0
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Oportunidades Ativas</p>
              <p className="text-2xl font-bold">{opportunities.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">
                {pipeline.length > 0 && opportunities.length > 0
                  ? Math.round((opportunities.filter(o => o.stage_id === pipeline[pipeline.length - 1]?.id).length / opportunities.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipeline.map((stage, index) => (
            <div key={stage.id} className="space-y-3">
              <Card className={`p-4 ${getStageColor(index)} border-2`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">{stage.name}</h3>
                  <Badge variant="secondary">
                    {opportunities.filter(opp => opp.stage_id === stage.id).length}
                  </Badge>
                </div>
                <p className="text-sm font-semibold">
                  R$ {getStageTotal(stage.id).toLocaleString('pt-BR')}
                </p>
              </Card>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent/50' : 'bg-transparent'
                    }`}
                  >
                    {opportunities
                      .filter(opp => opp.stage_id === stage.id)
                      .map((opportunity, oppIndex) => (
                        <Draggable
                          key={opportunity.id}
                          draggableId={opportunity.id}
                          index={oppIndex}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 cursor-move hover:shadow-lg transition-shadow ${
                                snapshot.isDragging ? 'shadow-xl rotate-2' : ''
                              }`}
                            >
                              <h4 className="font-semibold text-sm mb-2">
                                {opportunity.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2">
                                {opportunity.company_name}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-green-600">
                                  R$ {(opportunity.value || 0).toLocaleString('pt-BR')}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {opportunity.probability || 0}%
                                </Badge>
                              </div>
                              {opportunity.expected_close_date && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Previsão: {new Date(opportunity.expected_close_date).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
