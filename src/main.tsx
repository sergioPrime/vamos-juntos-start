import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './hooks/useTheme'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vamos-juntos-theme">
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);
