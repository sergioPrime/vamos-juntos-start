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
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SuperAdminRoute } from "./components/auth/SuperAdminRoute";
import { AuthRedirect } from "./components/auth/AuthRedirect";
import Dashboard from "./pages/Dashboard";
import Receivables from "./pages/finance/Receivables";
import Payables from "./pages/finance/Payables";
import FinancialReports from "./pages/finance/FinancialReports";
import FinancialDashboard from "./pages/FinancialDashboard";
import Charges from "./pages/Charges";
import NFSe from "./pages/NFSe";
import Quotes from "./pages/Quotes";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PDV from "./pages/PDV";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
        <SubscriptionProvider>
          <TooltipProvider>
          <NotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
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
          <Route path="/finance/receivables" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Receivables />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/finance/payables" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Payables />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
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
                  <Receivables />
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
          <Route path="/quotes" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Quotes />
                </PageTransition>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/quotes/new" element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition direction="left">
                  <Quotes />
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
        </SubscriptionProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
