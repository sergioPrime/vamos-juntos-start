import { ClientCard, ClientProps } from "./ClientCard"
import { Sparkles } from "lucide-react"

const clients: ClientProps[] = [
  {
    id: "1",
    name: "TechSolutions",
    logo: "/clients/techsolutions-logo.png",
    description: "Empresa de tecnologia que otimizou seus processos internos e aumentou a produtividade em 40% usando o Prime ERP.",
    sector: "Tecnologia",
    testimonial: "O Prime ERP revolucionou nossa gestão. Agora temos controle total sobre projetos, finanças e equipe.",
    results: "40% mais produtividade"
  },
  {
    id: "2", 
    name: "VarejoMax",
    logo: "/clients/varejomax-logo.png",
    description: "Rede de varejo que integrou todas as suas filiais em uma única plataforma, melhorando o controle de estoque.",
    sector: "Varejo",
    testimonial: "Conseguimos unificar 15 lojas em um sistema só. O controle de estoque ficou perfeito.",
    results: "100% das filiais integradas"
  },
  {
    id: "3",
    name: "Indústria Nova", 
    logo: "/clients/industrianova-logo.png",
    description: "Indústria manufatureira que modernizou seus processos produtivos e reduziu custos operacionais significativamente.",
    sector: "Indústria",
    testimonial: "A automação dos processos nos trouxe uma economia impressionante e maior controle da produção.",
    results: "25% redução de custos"
  },
  {
    id: "4",
    name: "ServiçosPro",
    logo: "/clients/servicospro-logo.png", 
    description: "Empresa de serviços profissionais que melhorou o atendimento ao cliente e agilizou a emissão de documentos fiscais.",
    sector: "Serviços",
    testimonial: "Nossos clientes notaram a melhoria no atendimento. A emissão de NFS-e automática foi um diferencial.",
    results: "50% mais agilidade"
  }
]

export function ClientsSection() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Cases de Sucesso</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nossos Clientes Transformaram Seus Negócios
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Empresas de diversos setores já conquistaram resultados extraordinários 
            com o Prime ERP. Conheça algumas histórias de sucesso.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {clients.map((client, index) => (
            <ClientCard 
              key={client.id} 
              client={client}
              className="animate-fade-in"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Junte-se a centenas de empresas que já transformaram sua gestão
          </p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="text-2xl font-bold">+500</div>
            <div className="text-sm">Empresas Ativas</div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-2xl font-bold">98%</div>
            <div className="text-sm">Satisfação</div>
            <div className="w-px h-8 bg-border"></div>
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-sm">Suporte</div>
          </div>
        </div>
      </div>
    </section>
  )
}