import { useEffect } from "react"
import { Wallet, DollarSign, FileText, Users, BarChart3, Settings, CreditCard, Receipt, Quote, LayoutDashboard, Zap, ShoppingCart, TrendingUp, PieChart, Package } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
]

const financeItems = [
  { title: "Dashboard", url: "/finance/dashboard", icon: PieChart },
  { title: "Receber", url: "/finance/receivables", icon: Wallet },
  { title: "Pagar", url: "/finance/payables", icon: CreditCard },
  { title: "Cobranças", url: "/charges", icon: Receipt },
  { title: "Relatórios", url: "/finance/reports", icon: BarChart3 },
]

const businessItems = [
  { title: "NFS-e", url: "/nfse", icon: FileText },
  { title: "PDV", url: "/pdv", icon: Zap },
  { title: "Produtos", url: "/products", icon: DollarSign },
  { title: "Pedidos", url: "/orders", icon: Receipt },
  { title: "Orçamentos", url: "/quotes", icon: Quote },
  { title: "Clientes", url: "/customers", icon: Users },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
]

const purchaseItems = [
  { title: "Solicitações", url: "/purchases/requests", icon: ShoppingCart },
  { title: "Relatórios", url: "/purchases/reports", icon: TrendingUp },
]

const supplierItems = [
  { title: "Fornecedores", url: "/suppliers", icon: Users },
]

const inventoryItems = [
  { title: "Gestão de Estoque", url: "/inventory", icon: Package },
  { title: "Relatórios", url: "/inventory/reports", icon: BarChart3 },
]


const configItems = [
  { title: "Configurações", url: "/settings", icon: Settings },
]


export function AppSidebar() {
  const { setOpen, open } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  

  // Auto-collapse when navigating to new routes
  useEffect(() => {
    setOpen(false)
  }, [currentPath, setOpen])

  const isActive = (path: string) => currentPath === path

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"


  return (
    <div className="relative">
      <Sidebar
        collapsible="icon"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <SidebarContent>
          <div className="p-4">
            <h2 className={`font-bold text-sidebar-primary ${open ? "text-lg" : "text-xs text-center"}`}>
              {open ? "Prime ERP" : "Prime"}
            </h2>
          </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className="h-4 w-4" />
                       {open && <span>{item.title}</span>}
                     </NavLink>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>

         <SidebarGroup>
           {open && <SidebarGroupLabel>Financeiro</SidebarGroupLabel>}
           <SidebarGroupContent>
             <SidebarMenu>
               {financeItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={getNavClass}>
                       <item.icon className="h-4 w-4" />
                         {open && <span>{item.title}</span>}
                     </NavLink>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>

         <SidebarGroup>
           {open && <SidebarGroupLabel>Vendas</SidebarGroupLabel>}
           <SidebarGroupContent>
             <SidebarMenu>
               {businessItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={getNavClass}>
                       <item.icon className="h-4 w-4" />
                       {open && <span>{item.title}</span>}
                     </NavLink>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>

         <SidebarGroup>
           {open && <SidebarGroupLabel>Compras</SidebarGroupLabel>}
           <SidebarGroupContent>
             <SidebarMenu>
               {purchaseItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={getNavClass}>
                       <item.icon className="h-4 w-4" />
                         {open && <span>{item.title}</span>}
                     </NavLink>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>

         <SidebarGroup>
           <SidebarGroupContent>
             <SidebarMenu>
               {supplierItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={getNavClass}>
                       <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                     </NavLink>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>

         <SidebarGroup>
           {open && <SidebarGroupLabel>Estoque</SidebarGroupLabel>}
           <SidebarGroupContent>
             <SidebarMenu>
               {inventoryItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={getNavClass}>
                       <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                     </NavLink>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
           </SidebarGroupContent>
         </SidebarGroup>

         <SidebarGroup>
           <SidebarGroupContent>
             <SidebarMenu>
               {configItems.map((item) => (
                 <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton asChild>
                     <NavLink to={item.url} className={getNavClass}>
                       <item.icon className="h-4 w-4" />
                       {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      </Sidebar>
    </div>
  )
}