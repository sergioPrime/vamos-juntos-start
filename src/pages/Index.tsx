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
import { ClientsSection } from "@/components/landing/ClientsSection"
import primegestorLogo from "@/assets/primegestor-logo.png"

const Index = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // Only redirect if user is authenticated AND clicked on navigation buttons
  // Do not auto-redirect on initial page load

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
              <img 
                src={primegestorLogo} 
                alt="PrimeGestor Logo" 
                className="w-10 h-10 object-contain"
              />
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
      <section className="relative container mx-auto px-6 py-20 text-center overflow-hidden">
        {/* Animated background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10">
          <Badge variant="secondary" className="mb-6 animate-fade-in hover:scale-110 transition-transform cursor-default backdrop-blur-sm bg-background/80">
            <Zap className="h-3 w-3 mr-1 animate-pulse" />
            Sistema ERP Completo
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-gradient">
              Gerencie seu negócio com
            </span>
            <span className="text-primary block mt-2 animate-gradient bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent">
              inteligência e eficiência
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-fade-in leading-relaxed" style={{ animationDelay: '0.2s' }}>
            O Prime ERP é a solução completa para gestão empresarial, integrando vendas, estoque, 
            financeiro e muito mais em uma única plataforma moderna e intuitiva.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:scale-105"
            >
              <span className="relative z-10 flex items-center">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="group backdrop-blur-sm border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Ver Demonstração
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">✨</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <Card className="text-center border-0 bg-background/60 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">99.9%</div>
              <div className="text-sm text-muted-foreground mt-2">Uptime garantido</div>
            </CardContent>
          </Card>
          <Card className="text-center border-0 bg-background/60 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">24/7</div>
              <div className="text-sm text-muted-foreground mt-2">Suporte especializado</div>
            </CardContent>
          </Card>
          <Card className="text-center border-0 bg-background/60 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform">100%</div>
              <div className="text-sm text-muted-foreground mt-2">Segurança de dados</div>
            </CardContent>
          </Card>
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
            <Card 
              key={index} 
              className="relative overflow-hidden border-0 bg-background/60 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="relative z-10">
                <div className="text-primary mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
              
              {/* Animated border gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
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
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="group-hover:text-primary transition-colors duration-300">{benefit}</span>
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

      {/* Clients Section */}
      <ClientsSection />

      {/* CTA Section */}
      <section className="relative container mx-auto px-6 py-20 text-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 animate-gradient"></div>
        
        <Card className="relative border-0 bg-gradient-to-br from-primary via-primary to-blue-600 text-primary-foreground shadow-2xl max-w-4xl mx-auto overflow-hidden">
          {/* Animated shine effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-[slide-in-right_3s_ease-in-out_infinite]"></div>
          </div>
          
          <CardContent className="relative z-10 p-12">
            <div className="relative inline-block mb-6">
              <Shield className="h-16 w-16 mx-auto opacity-90 animate-pulse" />
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
              Pronto para <span className="underline decoration-wavy decoration-white/50">transformar</span> seu negócio?
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Comece gratuitamente e descubra como o Prime ERP pode revolucionar 
              a gestão da sua empresa em poucos minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                size="lg" 
                variant="secondary" 
                onClick={() => navigate('/auth')}
                className="group relative overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <span className="relative z-10 flex items-center">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:border-white"
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
