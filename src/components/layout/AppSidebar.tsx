import { useState } from "react"
import { Wallet, DollarSign, FileText, Users, BarChart3, Settings, CreditCard, Receipt, Quote, LayoutDashboard, Zap, ShoppingCart, TrendingUp, PieChart, Package, RefreshCw, ChevronDown, UserPlus, Calculator, Target, Calendar, Table, FileSearch } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useSidebarConfig } from "@/contexts/SidebarConfigContext"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
]

const financeItems = [
  { title: "Dashboard", url: "/finance/dashboard", icon: PieChart },
  { title: "Lançamentos", url: "/finance/lancamentos?tab=listagem", icon: FileText },
  { title: "Boletos", url: "/finance/boletos", icon: Receipt },
  { title: "Cobranças", url: "/charges", icon: Receipt },
  { title: "Relatórios", url: "/finance/reports", icon: BarChart3 },
]

const businessItems = [
  { title: "PDV", url: "/pdv", icon: Zap },
  { title: "Operações do PDV", url: "/pdv/operacoes", icon: Settings },
  { title: "Pedidos e Orçamentos", url: "/orders-quotes", icon: Quote },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
]

const purchaseItems = [
  { title: "Solicitações", url: "/purchases/requests", icon: ShoppingCart },
  { title: "Relatórios", url: "/purchases/reports", icon: TrendingUp },
]


const inventoryItems = [
  { title: "Gestão de Estoque", url: "/inventory", icon: Package },
  { title: "Relatórios", url: "/inventory/reports", icon: BarChart3 },
]

const cadastrosItems = [
  { title: "Pessoas", url: "/cadastros/pessoas", icon: Users },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Tipo de Compromisso", url: "/cadastros/tipos-compromisso", icon: Settings },
    { title: "Categorias de Vendas", url: "/cadastros/categorias-vendas", icon: ShoppingCart },
    { title: "Tabela de Preços", url: "/cadastros/tabela-precos", icon: Table },
  { title: "Plano de Contas", url: "/cadastros/plano-de-contas", icon: Calculator },
  { title: "Centros de Custo", url: "/cadastros/centros-de-custo", icon: Target },
  { title: "Formas de Pagamento", url: "/cadastros/formas-de-pagamento", icon: CreditCard },
  { title: "Contas Bancárias", url: "/cadastros/contas-bancarias", icon: Wallet },
]



const configItems = [
  { title: "Permissões e Acessos", url: "/settings/permissions", icon: Settings },
  { title: "Logs de Auditoria", url: "/settings/audit-logs", icon: FileSearch },
  { title: "Empresas", url: "/settings/companies", icon: Settings },
  { title: "Integrações", url: "/settings/integrations", icon: Settings },
  { title: "Configurações do ERP", url: "/settings/erp-config", icon: Settings },
  { title: "Renovar Licença", url: "/settings/renovar-licenca", icon: RefreshCw },
]


export function AppSidebar() {
  const { setOpen, open } = useSidebar()
  const { clickOnlyMode } = useSidebarConfig()
  const location = useLocation()
  const currentPath = location.pathname
  
  // State for module expansion
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    dashboard: true,
    finance: false,
    sales: false,
    purchases: false,
    inventory: false,
    cadastros: false,
    settings: false,
  })

  const isActive = (path: string) => currentPath === path

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"

  const toggleModule = (moduleKey: string) => {
    setExpandedModules(prev => {
      const isCurrentlyExpanded = prev[moduleKey]
      
      // If clicking on already expanded module, just close it
      if (isCurrentlyExpanded) {
        return {
          ...prev,
          [moduleKey]: false
        }
      }
      
      // If opening a new module, close all others and open this one
      const newState: Record<string, boolean> = {
        dashboard: true, // Dashboard always stays open
        finance: false,
        sales: false,
        purchases: false,
        inventory: false,
        cadastros: false,
        settings: false,
      }
      
      newState[moduleKey] = true
      return newState
    })
  }

  const handleMouseEnter = () => {
    if (!clickOnlyMode && !open) {
      setOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (!clickOnlyMode && open) {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Sidebar 
        collapsible="icon"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarRail />
        <SidebarContent className="space-y-0 -space-y-2">
          <div className="p-4">
            <h2 className={`font-bold text-sidebar-primary ${open ? "text-lg" : "text-xs text-center"}`}>
              {open ? "Prime ERP" : "Prime"}
            </h2>
          </div>

          {/* Dashboard - Always expanded */}
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Finance Module */}
          <Collapsible 
            open={expandedModules.finance} 
            onOpenChange={() => toggleModule('finance')}
          >
            <SidebarGroup className="py-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md p-2 flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Financeiro
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedModules.finance ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {financeItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Sales Module */}
          <Collapsible 
            open={expandedModules.sales} 
            onOpenChange={() => toggleModule('sales')}
          >
            <SidebarGroup className="py-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md p-2 flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Vendas
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedModules.sales ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {businessItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Purchases Module */}
          <Collapsible 
            open={expandedModules.purchases} 
            onOpenChange={() => toggleModule('purchases')}
          >
            <SidebarGroup className="py-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md p-2 flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Compras
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedModules.purchases ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {purchaseItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>


          {/* Inventory Module */}
          <Collapsible 
            open={expandedModules.inventory} 
            onOpenChange={() => toggleModule('inventory')}
          >
            <SidebarGroup className="py-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md p-2 flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Estoque
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedModules.inventory ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {inventoryItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Cadastros Module */}
          <Collapsible 
            open={expandedModules.cadastros} 
            onOpenChange={() => toggleModule('cadastros')}
          >
            <SidebarGroup className="py-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md p-2 flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Cadastros
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedModules.cadastros ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {cadastrosItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>


          {/* Settings Module */}
          <Collapsible 
            open={expandedModules.settings} 
            onOpenChange={() => toggleModule('settings')}
          >
            <SidebarGroup className="py-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/50 rounded-md p-2 flex items-center justify-between transition-colors">
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expandedModules.settings ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {configItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

      </SidebarContent>
      </Sidebar>
    </div>
  )
}