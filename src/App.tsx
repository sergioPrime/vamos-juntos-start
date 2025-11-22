import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { PageTransition } from "./components/layout/PageTransition";
import { NotificationProvider } from "./components/ui/notification-system";
import { AuthProvider } from "./hooks/useAuth";
import { OrganizationProvider } from "./hooks/useOrganization";
import { SubscriptionProvider } from "./hooks/useSubscription";
import { SidebarConfigProvider } from "./contexts/SidebarConfigContext";
import { AnimationProvider } from "./contexts/AnimationContext";
import { ThemeProvider } from "./hooks/useTheme";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SuperAdminRoute } from "./components/auth/SuperAdminRoute";
import { AuthErrorBoundary } from "./components/auth/AuthErrorBoundary";
import { lazy, Suspense } from "react";
import { LoadingWrapper } from "./components/animations/LoadingWrapper";

// Lazy load all pages for optimal performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Lancamentos = lazy(() => import("./pages/finance/Lancamentos"));
const Boletos = lazy(() => import("./pages/finance/Boletos"));
const FinancialReports = lazy(() => import("./pages/finance/FinancialReports"));
const FinancialDashboard = lazy(() => import("./pages/FinancialDashboard"));
const Charges = lazy(() => import("./pages/Charges"));
const NFSe = lazy(() => import("./pages/NFSe"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Customers = lazy(() => import("./pages/Customers"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Permissions = lazy(() => import("./pages/settings/Permissions"));
const AuditLogs = lazy(() => import("./pages/settings/AuditLogs"));
const Companies = lazy(() => import("./pages/settings/Companies"));
const Integrations = lazy(() => import("./pages/settings/Integrations"));
const ERPConfig = lazy(() => import("./pages/settings/ERPConfig"));
const Blockchain = lazy(() => import("./pages/settings/Blockchain"));
const RenovarLicenca = lazy(() => import("./pages/RenovarLicenca"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const PDV = lazy(() => import("./pages/PDV"));
const OperacoesPDV = lazy(() => import("./pages/pdv/OperacoesPDV"));
const TestePDV = lazy(() => import("./pages/pdv/TestePDV"));
const Products = lazy(() => import("./pages/Products"));
const Orders = lazy(() => import("./pages/Orders"));
const OrdersAndQuotes = lazy(() => import("./pages/OrdersAndQuotes"));
const OrdersQuotesForm = lazy(() => import("./pages/OrdersQuotesForm"));
const PurchaseRequests = lazy(() => import("./pages/purchases/PurchaseRequests"));
const PurchaseReports = lazy(() => import("./pages/purchases/PurchaseReports"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Welcome = lazy(() => import("./pages/onboarding/Welcome"));
const Signup = lazy(() => import("./pages/onboarding/Signup"));
const BusinessType = lazy(() => import("./pages/onboarding/BusinessType"));
const Tutorial = lazy(() => import("./pages/onboarding/Tutorial"));
const Auth = lazy(() => import("./pages/Auth"));
const NewUserPlans = lazy(() => import("./pages/NewUserPlans"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Inventory = lazy(() => import("./pages/Inventory"));
const StockReports = lazy(() => import("./pages/StockReports"));
const StockEntryPage = lazy(() => import("./pages/inventory/StockEntry"));
const StockExitPage = lazy(() => import("./pages/inventory/StockExit"));
const StockTransferPage = lazy(() => import("./pages/inventory/StockTransfer"));
const ReturnsPage = lazy(() => import("./pages/inventory/Returns"));
const InventoryReportsPage = lazy(() => import("./pages/inventory/InventoryReports"));
const InventoryAlertsPage = lazy(() => import("./pages/inventory/InventoryAlerts"));
const OrderForm = lazy(() => import("./components/orders/OrderForm"));
const QuoteForm = lazy(() => import("./components/quotes/QuoteForm"));
const ProductionOrders = lazy(() => import("./pages/production/ProductionOrders"));
const Pessoas = lazy(() => import("./pages/Pessoas").then(module => ({ default: module.Pessoas })));
const PlanoDeContas = lazy(() => import("./pages/settings/PlanoDeContas"));
const CentrosDeCusto = lazy(() => import("./pages/settings/CentrosDeCusto"));
const PaymentMethods = lazy(() => import("./pages/cadastros/PaymentMethods"));
const BankAccounts = lazy(() => import("./pages/cadastros/BankAccounts"));
const Appointments = lazy(() => import("./pages/cadastros/Appointments"));
const AppointmentTypes = lazy(() => import("./pages/cadastros/AppointmentTypes"));
const SalesCategories = lazy(() => import("./pages/cadastros/SalesCategories"));
const SalesCategoriesForm = lazy(() => import("./pages/cadastros/SalesCategoriesForm"));
const PriceTables = lazy(() => import("./pages/cadastros/PriceTables"));
const PriceTablesForm = lazy(() => import("./pages/cadastros/PriceTablesForm"));
const Warehouses = lazy(() => import("./pages/cadastros/Warehouses"));
const WarehouseForm = lazy(() => import("./pages/cadastros/WarehouseForm"));
const TaxGroups = lazy(() => import("./pages/cadastros/TaxGroups"));
const FiscalOperations = lazy(() => import("./pages/cadastros/FiscalOperations"));
const FiscalOperationsForm = lazy(() => import("./pages/cadastros/FiscalOperationsForm"));
const NFe = lazy(() => import("./pages/fiscal/NFe"));
const NFeForm = lazy(() => import("./pages/fiscal/NFeForm"));
const Index = lazy(() => import("./pages/Index"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vamos-juntos-theme">
      <AuthErrorBoundary>
        <AuthProvider>
          <OrganizationProvider>
            <SubscriptionProvider>
              <SidebarConfigProvider>
                <AnimationProvider>
                  <TooltipProvider>
                    <NotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <Routes>
          <Route path="/" element={
            <PageTransition direction="fade">
              <Index />
            </PageTransition>
          } />
          <Route path="/auth" element={<Auth />} />
          <Route path="/planos-novos-usuarios" element={
            <ProtectedRoute>
              <PageTransition direction="right">
                <NewUserPlans />
              </PageTransition>
            </ProtectedRoute>
          } />
          
          {/* Onboarding routes */}
          <Route path="/onboarding" element={<Welcome />} />
          <Route path="/onboarding/signup" element={<Signup />} />
          <Route path="/onboarding/business-type" element={<BusinessType />} />
          <Route path="/onboarding/tutorial" element={<Tutorial />} />
          
          {/* Main app routes - Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="right">
                  <Dashboard />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />

          
          
          <Route path="/finance/lancamentos" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Lancamentos />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/finance/boletos" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Boletos />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/finance/receivables" element={<Navigate to="/finance/lancamentos" replace />} />
          <Route path="/finance/payables" element={<Navigate to="/finance/lancamentos" replace />} />
          <Route path="/finance/reports" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <FinancialReports />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/finance/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <FinancialDashboard />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/charges" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Charges />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/charges/new" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Lancamentos />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/nfse" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <NFSe />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/pdv" element={
            <ProtectedRoute>
              <PageTransition direction="left">
                <PDV />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/pdv/operacoes" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <OperacoesPDV />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/pdv/teste" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <TestePDV />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Products />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Orders />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <OrderForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/purchases/requests" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PurchaseRequests />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/purchases/reports" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PurchaseReports />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Suppliers />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Inventory />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/reports" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <StockReports />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/entry" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <StockEntryPage />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/exit" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <StockExitPage />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/transfer" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <StockTransferPage />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/returns" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <ReturnsPage />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/advanced-reports" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <InventoryReportsPage />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/alerts" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <InventoryAlertsPage />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/quotes" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Quotes />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/quotes/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <QuoteForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders-quotes" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <OrdersAndQuotes />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders-quotes/new" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <OrdersQuotesForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders-quotes/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <OrdersQuotesForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/production/orders" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <ProductionOrders />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Customers />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/pessoas" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Pessoas />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="fade">
                  <Reports />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Settings />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/permissions" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Permissions />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/audit-logs" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <AuditLogs />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/blockchain" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Blockchain />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/companies" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Companies />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/integrations" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Integrations />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/erp-config" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <ERPConfig />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/renovar-licenca" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <RenovarLicenca />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/plano-de-contas" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PlanoDeContas />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/centros-de-custo" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <CentrosDeCusto />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/payment-methods" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PaymentMethods />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/bank-accounts" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <BankAccounts />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/appointments" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Appointments />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/appointment-types" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <AppointmentTypes />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/sales-categories" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <SalesCategories />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/sales-categories/new" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <SalesCategoriesForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/sales-categories/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <SalesCategoriesForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/price-tables" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PriceTables />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/price-tables/new" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PriceTablesForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/price-tables/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PriceTablesForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/warehouses" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Warehouses />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/warehouses/new" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <WarehouseForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/warehouses/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <WarehouseForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/tax-groups" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <TaxGroups />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/fiscal-operations" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <FiscalOperations />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/fiscal-operations/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <FiscalOperationsForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/categorias-vendas" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <SalesCategories />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/categorias-vendas/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <SalesCategoriesForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Fiscal routes */}
          <Route path="/fiscal/nfe" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <NFe />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/fiscal/nfe/new" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <NFeForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/fiscal/nfe/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <NFeDetails />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/fiscal/nfe/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <NFeForm />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <SuperAdminRoute>
              <AppLayout>
                <PageTransition direction="right">
                  <AdminDashboard />
                </PageTransition>
              </AppLayout>
            </SuperAdminRoute>
          } />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
            </Suspense>
          </BrowserRouter>
                  </NotificationProvider>
                </TooltipProvider>
              </AnimationProvider>
            </SidebarConfigProvider>
          </SubscriptionProvider>
        </OrganizationProvider>
      </AuthProvider>
      </AuthErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

