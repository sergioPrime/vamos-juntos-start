import { useState, useEffect } from "react"
import { User, Building2, Monitor, Tag, CheckCircle, LogOut } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"

interface Company {
  id: string
  name: string
}

interface PriceTable {
  id: string
  name: string
}

interface User {
  id: string
  first_name?: string
  last_name?: string
  email?: string
}

interface PDVHeaderProps {
  selectedSeller?: string
  selectedCompany?: string
  selectedTerminal?: string
  selectedPriceTable?: string
  onSellerChange?: (value: string) => void
  onCompanyChange?: (value: string) => void
  onTerminalChange?: (value: string) => void
  onPriceTableChange?: (value: string) => void
}

const PDVHeader = ({
  selectedSeller,
  selectedCompany,
  selectedTerminal,
  selectedPriceTable,
  onSellerChange,
  onCompanyChange,
  onTerminalChange,
  onPriceTableChange,
}: PDVHeaderProps) => {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const navigate = useNavigate()
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [priceTables, setPriceTables] = useState<PriceTable[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [systemStatus, setSystemStatus] = useState("operante")

  useEffect(() => {
    if (currentOrg?.id) {
      loadCompanies()
      loadPriceTables()
      loadUsers()
    }
  }, [currentOrg])

  const loadCompanies = async () => {
    if (!currentOrg?.id) return
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCompanies(data || [])
      
      // Auto-select default company if not selected
      if (!selectedCompany && data && data.length > 0) {
        const defaultCompany = data.find(c => c.name === 'PRIMEGESTOR') || data[0]
        onCompanyChange?.(defaultCompany.id)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const loadPriceTables = async () => {
    if (!currentOrg?.id) return
    try {
      const { data, error } = await supabase
        .from('price_tables')
        .select('id, name')
        .eq('org_id', currentOrg.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setPriceTables(data || [])
      
      // Auto-select first price table if not selected
      if (!selectedPriceTable && data && data.length > 0) {
        onPriceTableChange?.(data[0].id)
      }
    } catch (error) {
      console.error('Error loading price tables:', error)
    }
  }

  const loadUsers = async () => {
    if (!currentOrg?.id) return
    try {
      // Simplified approach - just load current user for now
      if (user?.id) {
        const mockUsers = [{
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || ''
        }]
        
        setUsers(mockUsers)
        
        // Auto-select current user if not selected
        if (!selectedSeller) {
          onSellerChange?.(user.id)
        }
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleLogout = () => {
    navigate('/dashboard')
  }

  const getUserDisplayName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId)
    if (!foundUser) return userId
    
    const fullName = `${foundUser.first_name || ''} ${foundUser.last_name || ''}`.trim()
    return fullName || foundUser.email || userId
  }

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || companyId
  }

  const getPriceTableName = (priceTableId: string) => {
    const priceTable = priceTables.find(pt => pt.id === priceTableId)
    return priceTable?.name || priceTableId
  }

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-primary-foreground rounded-lg p-2 font-bold text-lg">
              PDV
            </div>
          </div>

          {/* Selectors */}
          <div className="flex items-center space-x-3">
            {/* Vendedor */}
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground min-w-0">Vendedor</span>
              <Select value={selectedSeller} onValueChange={onSellerChange}>
                <SelectTrigger className="w-48 bg-background border-input">
                  <SelectValue placeholder="Selecionar vendedor" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserDisplayName(user.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empresa */}
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground min-w-0">Empresa</span>
              <Select value={selectedCompany} onValueChange={onCompanyChange}>
                <SelectTrigger className="w-48 bg-background border-input">
                  <SelectValue placeholder="Selecionar empresa" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Terminal */}
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground min-w-0">Terminal</span>
              <Select value={selectedTerminal} onValueChange={onTerminalChange}>
                <SelectTrigger className="w-32 bg-background border-input">
                  <SelectValue placeholder="Terminal" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="pdv01">PDV 01</SelectItem>
                  <SelectItem value="pdv02">PDV 02</SelectItem>
                  <SelectItem value="pdv03">PDV 03</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela de Preço */}
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground min-w-0">Tab. Preço</span>
              <Select value={selectedPriceTable} onValueChange={onPriceTableChange}>
                <SelectTrigger className="w-40 bg-background border-input">
                  <SelectValue placeholder="Tabela" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {priceTables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs font-medium">SEFAZ: {systemStatus}</span>
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PDVHeader