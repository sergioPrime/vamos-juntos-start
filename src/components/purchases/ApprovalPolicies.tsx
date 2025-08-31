import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { Plus, Settings, Trash2, Users, DollarSign, Clock, Edit, Shield } from 'lucide-react'

interface ApprovalPolicy {
  id: string
  policy_name: string
  description?: string
  cost_center?: string
  is_active: boolean
  created_at: string
  levels?: ApprovalPolicyLevel[]
}

interface ApprovalPolicyLevel {
  id: string
  level_order: number
  level_name: string
  min_amount: number
  max_amount?: number
  required_role?: string
  approver_count: number
  timeout_days?: number
}

interface NewPolicyForm {
  policy_name: string
  description: string
  cost_center: string
  levels: Omit<ApprovalPolicyLevel, 'id'>[]
}

interface NewLevelForm {
  level_name: string
  min_amount: number
  max_amount?: number
  required_role: string
  approver_count: number
  timeout_days: number
}

const ApprovalPolicies = () => {
  const { user } = useAuth()
  const { currentOrg: currentOrganization } = useOrganization()
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPolicy, setNewPolicy] = useState<NewPolicyForm>({
    policy_name: '',
    description: '',
    cost_center: '',
    levels: []
  })
  const [newLevel, setNewLevel] = useState<NewLevelForm>({
    level_name: '',
    min_amount: 0,
    max_amount: undefined,
    required_role: 'manager',
    approver_count: 1,
    timeout_days: 7
  })

  const roles = [
    { value: 'requester', label: 'Requisitante' },
    { value: 'buyer', label: 'Comprador' },
    { value: 'manager', label: 'Gestor' },
    { value: 'admin', label: 'Administrador' }
  ]

  useEffect(() => {
    if (currentOrganization) {
      fetchPolicies()
    }
  }, [currentOrganization])

  const fetchPolicies = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('approval_policies')
        .select(`
          *,
          approval_policy_levels(*)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching approval policies:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar políticas de aprovação",
          variant: "destructive",
        })
        return
      }

      // Sort levels by order
      const sortedData = data?.map(policy => ({
        ...policy,
        levels: policy.approval_policy_levels?.sort((a: any, b: any) => a.level_order - b.level_order) || []
      })) || []

      setPolicies(sortedData)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar políticas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createPolicy = async () => {
    if (!currentOrganization || !user) return

    try {
      const policyData = {
        policy_name: newPolicy.policy_name,
        description: newPolicy.description || null,
        cost_center: newPolicy.cost_center || null,
        org_id: currentOrganization.id
      }

      const { data: policy, error: policyError } = await supabase
        .from('approval_policies')
        .insert(policyData)
        .select()
        .single()

      if (policyError) {
        console.error('Error creating policy:', policyError)
        toast({
          title: "Erro",
          description: "Erro ao criar política de aprovação",
          variant: "destructive",
        })
        return
      }

      // Create levels
      if (newPolicy.levels.length > 0) {
        const levelsData = newPolicy.levels.map((level, index) => ({
          policy_id: policy.id,
          level_order: index + 1,
          level_name: level.level_name,
          min_amount: level.min_amount,
          max_amount: level.max_amount,
          required_role: level.required_role,
          approver_count: level.approver_count,
          timeout_days: level.timeout_days
        }))

        const { error: levelsError } = await supabase
          .from('approval_policy_levels')
          .insert(levelsData)

        if (levelsError) {
          console.error('Error creating policy levels:', levelsError)
          toast({
            title: "Erro",
            description: "Erro ao criar níveis da política",
            variant: "destructive",
          })
          return
        }
      }

      toast({
        title: "Sucesso",
        description: "Política de aprovação criada com sucesso",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchPolicies()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar política",
        variant: "destructive",
      })
    }
  }

  const togglePolicyStatus = async (policyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('approval_policies')
        .update({ is_active: !isActive })
        .eq('id', policyId)

      if (error) {
        console.error('Error updating policy status:', error)
        toast({
          title: "Erro",
          description: "Erro ao atualizar status da política",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: `Política ${!isActive ? 'ativada' : 'desativada'} com sucesso`,
      })

      fetchPolicies()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar política",
        variant: "destructive",
      })
    }
  }

  const addLevel = () => {
    const newLevelOrder = newPolicy.levels.length + 1
    setNewPolicy(prev => ({
      ...prev,
      levels: [...prev.levels, {
        level_order: newLevelOrder,
        level_name: newLevel.level_name,
        min_amount: newLevel.min_amount,
        max_amount: newLevel.max_amount,
        required_role: newLevel.required_role,
        approver_count: newLevel.approver_count,
        timeout_days: newLevel.timeout_days
      }]
    }))

    // Reset new level form
    setNewLevel({
      level_name: '',
      min_amount: newLevel.max_amount || 0,
      max_amount: undefined,
      required_role: 'manager',
      approver_count: 1,
      timeout_days: 7
    })
  }

  const removeLevel = (index: number) => {
    setNewPolicy(prev => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index)
    }))
  }

  const resetForm = () => {
    setNewPolicy({
      policy_name: '',
      description: '',
      cost_center: '',
      levels: []
    })
    setNewLevel({
      level_name: '',
      min_amount: 0,
      max_amount: undefined,
      required_role: 'manager',
      approver_count: 1,
      timeout_days: 7
    })
  }

  const getRoleLabel = (role: string) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj?.label || role
  }

  const formatCurrency = (amount: number) => {
    return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  if (loading) {
    return <div className="p-6">Carregando políticas de aprovação...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Políticas de Aprovação</h2>
          <p className="text-muted-foreground">Configure limites e fluxos de aprovação hierárquicos</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Política
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Política de Aprovação</DialogTitle>
              <DialogDescription>
                Configure uma política com níveis hierárquicos de aprovação
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policy_name">Nome da Política *</Label>
                  <Input
                    id="policy_name"
                    value={newPolicy.policy_name}
                    onChange={(e) => setNewPolicy(prev => ({ ...prev, policy_name: e.target.value }))}
                    placeholder="Ex: Política Geral de Compras"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cost_center">Centro de Custo</Label>
                  <Input
                    id="cost_center"
                    value={newPolicy.cost_center}
                    onChange={(e) => setNewPolicy(prev => ({ ...prev, cost_center: e.target.value }))}
                    placeholder="Ex: ADM, VEN, PRO (vazio = todas)"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da política de aprovação"
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Níveis de Aprovação</h4>
                
                {/* Add new level form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Adicionar Nível</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="level_name">Nome do Nível *</Label>
                        <Input
                          id="level_name"
                          value={newLevel.level_name}
                          onChange={(e) => setNewLevel(prev => ({ ...prev, level_name: e.target.value }))}
                          placeholder="Ex: Supervisor, Gerente, Diretor"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="required_role">Papel Necessário</Label>
                        <Select 
                          value={newLevel.required_role} 
                          onValueChange={(value) => setNewLevel(prev => ({ ...prev, required_role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="min_amount">Valor Mínimo *</Label>
                        <Input
                          id="min_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newLevel.min_amount}
                          onChange={(e) => setNewLevel(prev => ({ ...prev, min_amount: Number(e.target.value) }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="max_amount">Valor Máximo</Label>
                        <Input
                          id="max_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newLevel.max_amount || ''}
                          onChange={(e) => setNewLevel(prev => ({ ...prev, max_amount: e.target.value ? Number(e.target.value) : undefined }))}
                          placeholder="Ilimitado"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="approver_count">Qtd Aprovadores</Label>
                        <Input
                          id="approver_count"
                          type="number"
                          min="1"
                          value={newLevel.approver_count}
                          onChange={(e) => setNewLevel(prev => ({ ...prev, approver_count: Number(e.target.value) }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="timeout_days">Timeout (dias)</Label>
                        <Input
                          id="timeout_days"
                          type="number"
                          min="1"
                          value={newLevel.timeout_days}
                          onChange={(e) => setNewLevel(prev => ({ ...prev, timeout_days: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <Button onClick={addLevel} variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Nível
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Current levels */}
                {newPolicy.levels.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-semibold">Níveis Configurados:</h5>
                    {newPolicy.levels.map((level, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="grid grid-cols-5 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Nível {index + 1}:</span>
                                  <p>{level.level_name}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Papel:</span>
                                  <p>{getRoleLabel(level.required_role || '')}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Faixa:</span>
                                  <p>
                                    {formatCurrency(level.min_amount)} - {level.max_amount ? formatCurrency(level.max_amount) : 'Ilimitado'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">Aprovadores:</span>
                                  <p>{level.approver_count}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Timeout:</span>
                                  <p>{level.timeout_days} dias</p>
                                </div>
                              </div>
                            </div>
                            
                            <Button onClick={() => removeLevel(index)} variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createPolicy} disabled={!newPolicy.policy_name || newPolicy.levels.length === 0}>
                Criar Política
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {policy.policy_name}
                    {policy.is_active ? (
                      <Badge variant="default" className="bg-green-600">Ativa</Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                    {policy.cost_center && (
                      <Badge variant="outline">{policy.cost_center}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{policy.description}</CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePolicyStatus(policy.id, policy.is_active)}
                  >
                    <Switch checked={policy.is_active} />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {policy.levels && policy.levels.length > 0 ? (
                <div className="space-y-3">
                  <h5 className="font-semibold text-sm">Níveis de Aprovação:</h5>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nível</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Papel Necessário</TableHead>
                        <TableHead>Faixa de Valor</TableHead>
                        <TableHead>Aprovadores</TableHead>
                        <TableHead>Timeout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policy.levels.map((level) => (
                        <TableRow key={level.id}>
                          <TableCell>{level.level_order}</TableCell>
                          <TableCell className="font-medium">{level.level_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRoleLabel(level.required_role || '')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(level.min_amount)} - {level.max_amount ? formatCurrency(level.max_amount) : 'Ilimitado'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {level.approver_count}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {level.timeout_days}d
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum nível de aprovação configurado</p>
              )}
            </CardContent>
          </Card>
        ))}
        
        {policies.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma política configurada</h3>
              <p className="text-muted-foreground mb-4">
                Configure políticas para automatizar fluxos de aprovação
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Política
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ApprovalPolicies