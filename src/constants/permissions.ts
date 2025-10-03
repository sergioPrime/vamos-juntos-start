// Module keys based on AppSidebar structure
export const MODULES = {
  DASHBOARD: 'dashboard',
  FINANCEIRO: 'financeiro',
  VENDAS: 'vendas',
  COMPRAS: 'compras',
  ESTOQUE: 'estoque',
  CADASTROS: 'cadastros',
  PRODUCAO: 'producao',
  RELATORIOS: 'relatorios',
  CONFIGURACOES: 'configuracoes',
} as const;

export type ModuleKey = typeof MODULES[keyof typeof MODULES];

// Feature keys for granular permissions
export const FEATURES = {
  // Financeiro
  LANCAMENTOS: 'financeiro.lancamentos',
  CONTAS_RECEBER: 'financeiro.contas_receber',
  CONTAS_PAGAR: 'financeiro.contas_pagar',
  PLANO_CONTAS: 'financeiro.plano_contas',
  CENTROS_CUSTO: 'financeiro.centros_custo',
  CONTAS_BANCARIAS: 'financeiro.contas_bancarias',
  
  // Vendas
  PEDIDOS: 'vendas.pedidos',
  ORCAMENTOS: 'vendas.orcamentos',
  PDV: 'vendas.pdv',
  CLIENTES: 'vendas.clientes',
  TABELAS_PRECO: 'vendas.tabelas_preco',
  
  // Compras
  PEDIDOS_COMPRA: 'compras.pedidos',
  FORNECEDORES: 'compras.fornecedores',
  APROVACOES: 'compras.aprovacoes',
  
  // Estoque
  PRODUTOS: 'estoque.produtos',
  MOVIMENTACOES: 'estoque.movimentacoes',
  ENTRADA: 'estoque.entrada',
  SAIDA: 'estoque.saida',
  TRANSFERENCIA: 'estoque.transferencia',
  DEVOLUCOES: 'estoque.devolucoes',
  
  // Cadastros
  PESSOAS: 'cadastros.pessoas',
  METODOS_PAGAMENTO: 'cadastros.metodos_pagamento',
  CATEGORIAS_VENDAS: 'cadastros.categorias_vendas',
  COMPROMISSOS: 'cadastros.compromissos',
  
  // Produção
  ORDENS_PRODUCAO: 'producao.ordens',
  
  // Relatórios
  RELATORIOS_VENDAS: 'relatorios.vendas',
  RELATORIOS_COMPRAS: 'relatorios.compras',
  RELATORIOS_ESTOQUE: 'relatorios.estoque',
  RELATORIOS_FINANCEIRO: 'relatorios.financeiro',
  
  // Configurações
  EMPRESAS: 'configuracoes.empresas',
  INTEGRACOES: 'configuracoes.integracoes',
  PERMISSOES: 'configuracoes.permissoes',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

export type PermissionType = 'create' | 'read' | 'update' | 'delete';

export interface ModulePermission {
  id: string;
  org_id: string;
  user_id: string;
  module_key: ModuleKey;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeaturePermission {
  id: string;
  org_id: string;
  user_id: string;
  feature_key: FeatureKey;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

// Module information for UI
export const MODULE_INFO: Record<ModuleKey, { name: string; icon: string; description: string }> = {
  [MODULES.DASHBOARD]: {
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    description: 'Visão geral e indicadores',
  },
  [MODULES.FINANCEIRO]: {
    name: 'Financeiro',
    icon: 'DollarSign',
    description: 'Gestão financeira completa',
  },
  [MODULES.VENDAS]: {
    name: 'Vendas',
    icon: 'ShoppingCart',
    description: 'Pedidos, orçamentos e PDV',
  },
  [MODULES.COMPRAS]: {
    name: 'Compras',
    icon: 'ShoppingBag',
    description: 'Gestão de compras',
  },
  [MODULES.ESTOQUE]: {
    name: 'Estoque',
    icon: 'Package',
    description: 'Controle de estoque',
  },
  [MODULES.CADASTROS]: {
    name: 'Cadastros',
    icon: 'FileText',
    description: 'Cadastros gerais',
  },
  [MODULES.PRODUCAO]: {
    name: 'Produção',
    icon: 'Factory',
    description: 'Ordens de produção',
  },
  [MODULES.RELATORIOS]: {
    name: 'Relatórios',
    icon: 'BarChart',
    description: 'Relatórios gerenciais',
  },
  [MODULES.CONFIGURACOES]: {
    name: 'Configurações',
    icon: 'Settings',
    description: 'Configurações do sistema',
  },
};
