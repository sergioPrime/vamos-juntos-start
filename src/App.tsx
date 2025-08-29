import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { PageTransition } from "./components/layout/PageTransition";
import { NotificationProvider } from "./components/ui/notification-system";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthRedirect } from "./components/auth/AuthRedirect";
import Dashboard from "./pages/Dashboard";
import Receivables from "./pages/finance/Receivables";
import Payables from "./pages/finance/Payables";
import Charges from "./pages/Charges";
import NFSe from "./pages/NFSe";
import Quotes from "./pages/Quotes";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Welcome from "./pages/onboarding/Welcome";
import Signup from "./pages/onboarding/Signup";
import BusinessType from "./pages/onboarding/BusinessType";
import Tutorial from "./pages/onboarding/Tutorial";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/auth" element={<Auth />} />
          
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
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
