import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { PageTransition } from "./components/layout/PageTransition";
import { NotificationProvider } from "./components/ui/notification-system";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NotificationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          
          {/* Onboarding routes */}
          <Route path="/onboarding" element={<Welcome />} />
          <Route path="/onboarding/signup" element={<Signup />} />
          <Route path="/onboarding/business-type" element={<BusinessType />} />
          <Route path="/onboarding/tutorial" element={<Tutorial />} />
          
          {/* Main app routes */}
          <Route path="/dashboard" element={
            <AppLayout>
              <PageTransition direction="right">
                <Dashboard />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/finance/receivables" element={
            <AppLayout>
              <PageTransition direction="left">
                <Receivables />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/finance/payables" element={
            <AppLayout>
              <PageTransition direction="left">
                <Payables />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/charges" element={
            <AppLayout>
              <PageTransition direction="left">
                <Charges />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/charges/new" element={
            <AppLayout>
              <PageTransition direction="left">
                <Receivables />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/nfse" element={
            <AppLayout>
              <PageTransition direction="left">
                <NFSe />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/quotes" element={
            <AppLayout>
              <PageTransition direction="left">
                <Quotes />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/quotes/new" element={
            <AppLayout>
              <PageTransition direction="left">
                <Quotes />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/customers" element={
            <AppLayout>
              <PageTransition direction="left">
                <Customers />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/reports" element={
            <AppLayout>
              <PageTransition direction="fade">
                <Reports />
              </PageTransition>
            </AppLayout>
          } />
          <Route path="/settings" element={
            <AppLayout>
              <PageTransition direction="left">
                <Settings />
              </PageTransition>
            </AppLayout>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
