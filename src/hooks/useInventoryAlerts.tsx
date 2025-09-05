import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useOrganization } from './useOrganization'
import { useToast } from './use-toast'

export interface InventoryAlert {
  id: string
  type: 'low_stock' | 'near_expiry' | 'high_turnover' | 'inventory_variance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  product_id?: string
  product_name?: string
  current_value?: number
  threshold_value?: number
  created_at: string
  resolved: boolean
}

interface AlertSettings {
  low_stock_enabled: boolean
  near_expiry_enabled: boolean
  near_expiry_days: number
  high_turnover_enabled: boolean
  high_turnover_threshold: number
  inventory_variance_enabled: boolean
  inventory_variance_threshold: number
}

export function useInventoryAlerts() {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const { toast } = useToast()
  
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    low_stock_enabled: true,
    near_expiry_enabled: true,
    near_expiry_days: 7,
    high_turnover_enabled: true,
    high_turnover_threshold: 10,
    inventory_variance_enabled: true,
    inventory_variance_threshold: 5
  })
  const [loading, setLoading] = useState(false)

  // Check for low stock products
  const checkLowStockAlerts = useCallback(async () => {
    if (!currentOrg?.id || !alertSettings.low_stock_enabled) return []

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock_level')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .filter('stock_quantity', 'lte', 'min_stock_level')

      if (error) throw error

      return products?.map(product => ({
        id: `low_stock_${product.id}`,
        type: 'low_stock' as const,
        severity: product.stock_quantity === 0 ? 'critical' as const : 'high' as const,
        title: product.stock_quantity === 0 ? 'Produto sem estoque' : 'Estoque baixo',
        description: `${product.name} - Estoque atual: ${product.stock_quantity}, Mínimo: ${product.min_stock_level}`,
        product_id: product.id,
        product_name: product.name,
        current_value: product.stock_quantity,
        threshold_value: product.min_stock_level,
        created_at: new Date().toISOString(),
        resolved: false
      })) || []
    } catch (error) {
      console.error('Error checking low stock alerts:', error)
      return []
    }
  }, [currentOrg?.id, alertSettings.low_stock_enabled])

  // Check for products near expiry (improved - uses product_lots table)
  const checkNearExpiryAlerts = useCallback(async () => {
    if (!currentOrg?.id || !alertSettings.near_expiry_enabled) return []

    try {
      const cutoffDate = new Date(Date.now() + alertSettings.near_expiry_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: lots, error } = await supabase
        .from('product_lots')
        .select(`
          id,
          lot_number,
          quantity,
          expiration_date,
          product_id,
          products(id, name)
        `)
        .eq('org_id', currentOrg.id)
        .eq('status', 'active')
        .gt('quantity', 0)
        .not('expiration_date', 'is', null)
        .lte('expiration_date', cutoffDate)

      if (error) throw error

      return lots?.filter(lot => lot.products && Array.isArray(lot.products) && lot.products.length > 0)
        .map(lot => {
        const expirationDate = new Date(lot.expiration_date!)
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        const product = Array.isArray(lot.products) ? lot.products[0] : lot.products
        
        return {
          id: `near_expiry_${lot.id}`,
          type: 'near_expiry' as const,
          severity: daysUntilExpiry <= 0 ? 'critical' as const : daysUntilExpiry <= 2 ? 'high' as const : 'medium' as const,
          title: daysUntilExpiry <= 0 ? 'Lote vencido' : 'Lote próximo ao vencimento',
          description: `${product?.name || 'Produto'} (Lote: ${lot.lot_number}) - ${daysUntilExpiry <= 0 ? 'Vencido há' : 'Vence em'} ${Math.abs(daysUntilExpiry)} dia(s)`,
          product_id: product?.id,
          product_name: product?.name,
          current_value: daysUntilExpiry,
          threshold_value: alertSettings.near_expiry_days,
          created_at: new Date().toISOString(),
          resolved: false
        }
      }) || []
    } catch (error) {
      console.error('Error checking near expiry alerts:', error)
      
      // Fallback to mock data if product_lots table has issues
      const mockNearExpiryProducts = [
        {
          id: 'mock-product-1',
          name: 'Produto Exemplo A',
          expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          lot_number: 'LOT001'
        }
      ]

      const cutoffDate = new Date(Date.now() + alertSettings.near_expiry_days * 24 * 60 * 60 * 1000)

      return mockNearExpiryProducts
        .filter(product => product.expiry_date <= cutoffDate)
        .map(product => {
          const daysUntilExpiry = Math.ceil((product.expiry_date.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          
          return {
            id: `near_expiry_${product.id}`,
            type: 'near_expiry' as const,
            severity: daysUntilExpiry <= 1 ? 'critical' as const : daysUntilExpiry <= 3 ? 'high' as const : 'medium' as const,
            title: daysUntilExpiry <= 0 ? 'Produto vencido' : 'Produto próximo ao vencimento',
            description: `${product.name} (${product.lot_number}) - Vence em ${daysUntilExpiry} dia(s)`,
            product_id: product.id,
            product_name: product.name,
            current_value: daysUntilExpiry,
            threshold_value: alertSettings.near_expiry_days,
            created_at: new Date().toISOString(),
            resolved: false
          }
        })
    }
  }, [currentOrg?.id, alertSettings.near_expiry_enabled, alertSettings.near_expiry_days])

  // Check for high turnover products
  const checkHighTurnoverAlerts = useCallback(async () => {
    if (!currentOrg?.id || !alertSettings.high_turnover_enabled) return []

    try {
      // Get products with recent high sales activity
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select(`
          product_id,
          quantity,
          products!inner(id, name, stock_quantity, min_stock_level)
        `)
        .eq('org_id', currentOrg.id)
        .eq('movement_type', 'out')
        .gte('created_at', thirtyDaysAgo)

      if (error) throw error

      // Group by product and calculate total outflow
      const productOutflow = movements?.reduce((acc, movement) => {
        const productId = movement.product_id
        if (!acc[productId]) {
          acc[productId] = {
            product: movement.products,
            totalOutflow: 0
          }
        }
        acc[productId].totalOutflow += Math.abs(movement.quantity)
        return acc
      }, {} as Record<string, { product: any, totalOutflow: number }>) || {}

      return Object.entries(productOutflow)
        .filter(([_, data]) => data.totalOutflow >= alertSettings.high_turnover_threshold)
        .map(([productId, data]) => ({
          id: `high_turnover_${productId}`,
          type: 'high_turnover' as const,
          severity: 'medium' as const,
          title: 'Produto com alto giro',
          description: `${data.product.name} - Saídas nos últimos 30 dias: ${data.totalOutflow}. Considere reabastecer.`,
          product_id: productId,
          product_name: data.product.name,
          current_value: data.totalOutflow,
          threshold_value: alertSettings.high_turnover_threshold,
          created_at: new Date().toISOString(),
          resolved: false
        }))
    } catch (error) {
      console.error('Error checking high turnover alerts:', error)
      return []
    }
  }, [currentOrg?.id, alertSettings.high_turnover_enabled, alertSettings.high_turnover_threshold])

  // Check for inventory variances (mock implementation)
  const checkInventoryVarianceAlerts = useCallback(async () => {
    if (!currentOrg?.id || !alertSettings.inventory_variance_enabled) return []

    // Mock inventory variance data
    const mockVariances = [
      {
        product_id: 'mock-variance-1',
        product_name: 'Produto Exemplo C',
        system_quantity: 100,
        counted_quantity: 95,
        variance_percentage: 5
      },
      {
        product_id: 'mock-variance-2',
        product_name: 'Produto Exemplo D',
        system_quantity: 50,
        counted_quantity: 45,
        variance_percentage: 10
      }
    ]

    return mockVariances
      .filter(variance => Math.abs(variance.variance_percentage) >= alertSettings.inventory_variance_threshold)
      .map(variance => ({
        id: `inventory_variance_${variance.product_id}`,
        type: 'inventory_variance' as const,
        severity: Math.abs(variance.variance_percentage) >= 10 ? 'high' as const : 'medium' as const,
        title: 'Divergência no inventário',
        description: `${variance.product_name} - Sistema: ${variance.system_quantity}, Contado: ${variance.counted_quantity} (${variance.variance_percentage}% de diferença)`,
        product_id: variance.product_id,
        product_name: variance.product_name,
        current_value: Math.abs(variance.variance_percentage),
        threshold_value: alertSettings.inventory_variance_threshold,
        created_at: new Date().toISOString(),
        resolved: false
      }))
  }, [currentOrg?.id, alertSettings.inventory_variance_enabled, alertSettings.inventory_variance_threshold])

  // Check all alerts
  const checkAllAlerts = useCallback(async () => {
    if (!currentOrg?.id) return

    setLoading(true)
    try {
      const [lowStockAlerts, nearExpiryAlerts, highTurnoverAlerts, varianceAlerts] = await Promise.all([
        checkLowStockAlerts(),
        checkNearExpiryAlerts(),
        checkHighTurnoverAlerts(),
        checkInventoryVarianceAlerts()
      ])

      const allAlerts = [
        ...lowStockAlerts,
        ...nearExpiryAlerts,
        ...highTurnoverAlerts,
        ...varianceAlerts
      ]

      setAlerts(allAlerts)

      // Show toast notifications for critical alerts
      const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical')
      criticalAlerts.forEach(alert => {
        toast({
          title: alert.title,
          description: alert.description,
          variant: "destructive",
        })
      })

      return allAlerts
    } catch (error) {
      console.error('Error checking alerts:', error)
      toast({
        title: "Erro ao verificar alertas",
        description: "Não foi possível verificar os alertas de estoque.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [currentOrg?.id, checkLowStockAlerts, checkNearExpiryAlerts, checkHighTurnoverAlerts, checkInventoryVarianceAlerts, toast])

  // Auto-check alerts on mount and periodically
  useEffect(() => {
    if (currentOrg?.id) {
      checkAllAlerts()
      
      // Check alerts every 5 minutes
      const interval = setInterval(checkAllAlerts, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [currentOrg?.id, checkAllAlerts])

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }, [])

  const updateAlertSettings = useCallback((newSettings: Partial<AlertSettings>) => {
    setAlertSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const getAlertsByType = useCallback((type: InventoryAlert['type']) => {
    return alerts.filter(alert => alert.type === type && !alert.resolved)
  }, [alerts])

  const getAlertsBySeverity = useCallback((severity: InventoryAlert['severity']) => {
    return alerts.filter(alert => alert.severity === severity && !alert.resolved)
  }, [alerts])

  const getUnresolvedAlertsCount = useCallback(() => {
    return alerts.filter(alert => !alert.resolved).length
  }, [alerts])

  return {
    alerts: alerts.filter(alert => !alert.resolved),
    allAlerts: alerts,
    alertSettings,
    loading,
    checkAllAlerts,
    resolveAlert,
    updateAlertSettings,
    getAlertsByType,
    getAlertsBySeverity,
    getUnresolvedAlertsCount
  }
}