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

import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/finance/Lancamentos";
import FinancialReports from "./pages/finance/FinancialReports";
import FinancialDashboard from "./pages/FinancialDashboard";
import Charges from "./pages/Charges";
import NFSe from "./pages/NFSe";
import Quotes from "./pages/Quotes";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Permissions from "./pages/settings/Permissions";
import Companies from "./pages/settings/Companies";
import Integrations from "./pages/settings/Integrations";
import ERPConfig from "./pages/settings/ERPConfig";
import RenovarLicenca from "./pages/RenovarLicenca";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PDV from "./pages/PDV";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import OrdersAndQuotes from "./pages/OrdersAndQuotes";
import OrdersQuotesForm from "./pages/OrdersQuotesForm";
import PurchaseRequests from "./pages/purchases/PurchaseRequests";
import PurchaseReports from "./pages/purchases/PurchaseReports";
import Suppliers from "./pages/Suppliers";
import Welcome from "./pages/onboarding/Welcome";
import Signup from "./pages/onboarding/Signup";
import BusinessType from "./pages/onboarding/BusinessType";
import Tutorial from "./pages/onboarding/Tutorial";
import Auth from "./pages/Auth";
import NewUserPlans from "./pages/NewUserPlans";
import NotFound from "./pages/NotFound";
import Inventory from "./pages/Inventory";
import StockReports from "./pages/StockReports";
import StockEntryPage from "./pages/inventory/StockEntry";
import StockExitPage from "./pages/inventory/StockExit";
import StockTransferPage from "./pages/inventory/StockTransfer";
import ReturnsPage from "./pages/inventory/Returns";
import InventoryReportsPage from "./pages/inventory/InventoryReports";
import InventoryAlertsPage from "./pages/inventory/InventoryAlerts";
import OrderForm from "./components/orders/OrderForm";
import QuoteForm from "./components/quotes/QuoteForm";
import ProductionOrders from "./pages/production/ProductionOrders";
import { Pessoas } from "./pages/Pessoas";
import PlanoDeContas from "./pages/settings/PlanoDeContas";
import CentrosDeCusto from "./pages/settings/CentrosDeCusto";
import PaymentMethods from "./pages/cadastros/PaymentMethods";
import BankAccounts from "./pages/cadastros/BankAccounts";
import Appointments from "./pages/cadastros/Appointments";
import AppointmentTypes from "./pages/cadastros/AppointmentTypes";
import SalesCategories from "./pages/cadastros/SalesCategories";
import SalesCategoriesForm from "./pages/cadastros/SalesCategoriesForm";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vamos-juntos-theme">
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
          {/* Redirect old routes */}
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
              <AppLayout>
                <PageTransition direction="left">
                  <PDV />
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
          <Route path="/inventory/entry" element={<StockEntryPage />} />
          <Route path="/inventory/exit" element={<StockExitPage />} />
          <Route path="/inventory/transfer" element={<StockTransferPage />} />
          <Route path="/inventory/returns" element={<ReturnsPage />} />
          <Route path="/inventory/advanced-reports" element={<InventoryReportsPage />} />
          <Route path="/inventory/alerts" element={<InventoryAlertsPage />} />
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
          <Route path="/cadastros/plano-de-contas" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PlanoDeContas />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/centros-de-custo" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <CentrosDeCusto />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/formas-de-pagamento" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <PaymentMethods />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/contas-bancarias" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <BankAccounts />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/agendamentos" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Appointments />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/cadastros/tipos-compromisso" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <AppointmentTypes />
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
          <Route path="/cadastros/categorias-vendas/novo" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <SalesCategoriesForm />
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
          <Route path="/admin" element={
            <ProtectedRoute>
              <SuperAdminRoute>
                <AppLayout>
                  <PageTransition direction="left">
                    <AdminDashboard />
                  </PageTransition>
                </AppLayout>
              </SuperAdminRoute>
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          </BrowserRouter>
          </NotificationProvider>
                </TooltipProvider>
              </AnimationProvider>
            </SidebarConfigProvider>
          </SubscriptionProvider>
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
