import { useState } from 'react';
import { Search, Plus, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScrapedPrice {
  name: string;
  price: number;
  url: string;
  marketplace: string;
  imageUrl?: string;
}

interface CompetitorPriceScraperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onAddCompetitor: (competitor: { name: string; price: number; url?: string }) => void;
}

const MARKETPLACES = [
  { value: 'mercadolivre', label: 'Mercado Livre', domain: 'mercadolivre.com.br' },
  { value: 'amazon', label: 'Amazon', domain: 'amazon.com.br' },
  { value: 'magazineluiza', label: 'Magazine Luiza', domain: 'magazineluiza.com.br' },
  { value: 'americanas', label: 'Americanas', domain: 'americanas.com.br' },
  { value: 'casasbahia', label: 'Casas Bahia', domain: 'casasbahia.com.br' },
];

export function CompetitorPriceScraper({
  open,
  onOpenChange,
  productName,
  onAddCompetitor,
}: CompetitorPriceScraperProps) {
  const [searchQuery, setSearchQuery] = useState(productName);
  const [selectedMarketplace, setSelectedMarketplace] = useState('mercadolivre');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapedPrice[]>([]);
  const [apiKeyWarning, setApiKeyWarning] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o nome do produto para buscar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResults([]);
    setApiKeyWarning(false);

    try {
      // Simulação de busca - Em produção, você deve usar uma API real de web scraping
      // Como ScrapingBee, ScraperAPI, ou Bright Data
      
      // Para usar uma API real, adicione a chave nos secrets do Supabase
      // e faça uma chamada para uma Edge Function que faz o scraping
      
      // Exemplo de URL de busca para cada marketplace
      const marketplace = MARKETPLACES.find(m => m.value === selectedMarketplace);
      const searchUrl = `https://${marketplace?.domain}/search?q=${encodeURIComponent(searchQuery)}`;
      
      console.log('Buscando em:', searchUrl);
      
      // Simulação de resultados (remova isso ao integrar com API real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults: ScrapedPrice[] = [
        {
          name: `${searchQuery} - Produto 1`,
          price: Math.random() * 1000 + 50,
          url: `${searchUrl}#produto1`,
          marketplace: marketplace?.label || '',
        },
        {
          name: `${searchQuery} - Produto 2`,
          price: Math.random() * 1000 + 50,
          url: `${searchUrl}#produto2`,
          marketplace: marketplace?.label || '',
        },
        {
          name: `${searchQuery} - Produto 3`,
          price: Math.random() * 1000 + 50,
          url: `${searchUrl}#produto3`,
          marketplace: marketplace?.label || '',
        },
      ];
      
      setResults(mockResults);
      
      toast({
        title: 'Busca concluída',
        description: `${mockResults.length} resultados encontrados`,
      });
      
    } catch (error) {
      console.error('Erro ao buscar preços:', error);
      toast({
        title: 'Erro ao buscar preços',
        description: 'Não foi possível buscar os preços. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = (result: ScrapedPrice) => {
    onAddCompetitor({
      name: `${result.marketplace} - ${result.name}`,
      price: result.price,
      url: result.url,
    });
    
    toast({
      title: 'Concorrente adicionado',
      description: 'O preço foi adicionado à análise de concorrência',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buscar Preços de Concorrentes</DialogTitle>
        </DialogHeader>

        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta é uma versão de demonstração. Para usar em produção, configure uma API de web scraping
            (ScrapingBee, ScraperAPI, etc) nos secrets do Supabase e crie uma Edge Function para fazer
            as requisições.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="search-query">Nome do Produto</Label>
            <Input
              id="search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome do produto"
            />
          </div>

          <div>
            <Label htmlFor="marketplace">Marketplace</Label>
            <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
              <SelectTrigger id="marketplace">
                <SelectValue placeholder="Selecione o marketplace" />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map((mp) => (
                  <SelectItem key={mp.value} value={mp.value}>
                    {mp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Preços
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Resultados Encontrados</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{result.marketplace}</Badge>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Ver produto
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <p className="text-sm font-medium line-clamp-2">{result.name}</p>
                          <p className="text-lg font-bold text-primary">
                            R$ {result.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddCompetitor(result)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum resultado encontrado</p>
              <p className="text-sm">Tente ajustar os termos de busca</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
