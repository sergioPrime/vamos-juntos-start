import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"
import { 
  BarChart3, 
  Users, 
  Package, 
  Wallet, 
  ShoppingCart, 
  FileText,
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  Building,
  Shield,
  Globe
} from "lucide-react"

const Index = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-xl mx-auto mb-6">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Prime ERP</h1>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Dashboard Inteligente",
      description: "Tenha visão completa do seu negócio com métricas em tempo real e alertas personalizados."
    },
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Gestão Financeira",
      description: "Controle completo de contas a pagar e receber, fluxo de caixa e relatórios financeiros."
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: "Controle de Estoque",
      description: "Gestão inteligente de produtos, alertas de estoque baixo e rastreamento por lotes."
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "Vendas & PDV",
      description: "Sistema completo de vendas com PDV integrado e gestão de pedidos automatizada."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Gestão de Clientes",
      description: "CRM integrado para relacionamento com clientes e fornecedores."
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "NFS-e Automática",
      description: "Emissão automática de notas fiscais eletrônicas integrada ao sistema."
    }
  ]

  const benefits = [
    "Integração completa entre todos os módulos",
    "Alertas inteligentes para tomada de decisão",
    "Relatórios avançados e analytics",
    "Interface moderna e intuitiva",
    "Segurança de dados com criptografia",
    "Suporte técnico especializado"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Building className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Prime ERP</h1>
                <p className="text-xs text-muted-foreground">Gestão Empresarial Completa</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Entrar
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <Badge variant="secondary" className="mb-6">
          <Zap className="h-3 w-3 mr-1" />
          Sistema ERP Completo
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Gerencie seu negócio com
          <span className="text-primary block">inteligência e eficiência</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          O Prime ERP é a solução completa para gestão empresarial, integrando vendas, estoque, 
          financeiro e muito mais em uma única plataforma moderna e intuitiva.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" onClick={() => navigate('/auth')} className="group">
            Começar Agora
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
            Ver Demonstração
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime garantido</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">Suporte especializado</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Segurança de dados</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Módulos integrados para uma gestão completa e eficiente do seu negócio
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="text-primary mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que escolher o Prime ERP?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Nossa plataforma oferece todas as ferramentas necessárias para 
                levar seu negócio ao próximo nível com eficiência e segurança.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="border-0 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Dashboard Principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Vendas do Mês</span>
                      <span className="font-semibold text-green-600">+23%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Estoque Otimizado</span>
                      <span className="font-semibold text-blue-600">98%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">3 alertas ativos</span>
                    <Badge variant="secondary">
                      <Globe className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <Card className="border-0 bg-primary text-primary-foreground shadow-2xl max-w-4xl mx-auto">
          <CardContent className="p-12">
            <Shield className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para transformar seu negócio?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Comece gratuitamente e descubra como o Prime ERP pode revolucionar 
              a gestão da sua empresa em poucos minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                onClick={() => navigate('/auth')}
                className="group"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Falar com Especialista
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold">Prime ERP</div>
                <div className="text-xs text-muted-foreground">Gestão Empresarial Completa</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Prime ERP. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
