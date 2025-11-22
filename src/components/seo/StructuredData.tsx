import { Helmet } from 'react-helmet-async';

/**
 * Organization Structured Data
 * Schema.org Organization para SEO
 */
export const OrganizationStructuredData = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PrimeGestor',
    url: 'https://primegestor.lovable.app',
    logo: 'https://primegestor.lovable.app/primegestor-logo.png',
    description: 'Sistema ERP completo para gestão empresarial',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-11-1234-5678',
      email: 'contato@primegestor.com',
      contactType: 'customer service',
      availableLanguage: ['Portuguese'],
    },
    sameAs: [
      'https://twitter.com/primegestor',
      'https://linkedin.com/company/primegestor',
      'https://facebook.com/primegestor',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

/**
 * Software Application Structured Data
 * Schema.org SoftwareApplication para SEO
 */
export const SoftwareApplicationStructuredData = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PrimeGestor ERP',
    description: 'Sistema ERP completo com módulos de vendas, estoque, financeiro, fiscal, CRM e muito mais',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Windows, macOS, Linux',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: 256,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Organization',
      name: 'PrimeGestor',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

/**
 * Breadcrumb Structured Data
 * Schema.org BreadcrumbList para navegação
 * 
 * @example
 * <BreadcrumbStructuredData
 *   items={[
 *     { name: 'Home', url: '/' },
 *     { name: 'Produtos', url: '/products' }
 *   ]}
 * />
 */
export const BreadcrumbStructuredData = ({ 
  items 
}: { 
  items: Array<{ name: string; url: string }> 
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://primegestor.lovable.app${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
