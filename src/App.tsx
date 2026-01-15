/**
 * Filnamn: App.tsx
 * Timestamp: 2026-01-15 15:48
 * Beskrivning: Optimerad för GitHub Pages med HashRouter. 
 * Löser 404-fel vid navigering, backning och siduppdatering.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom"; // HashRouter är nyckeln för GitHub
import Index from "./pages/Index";
import Ak6 from "./pages/Ak6";
import Ak7 from "./pages/Ak7";
import Ak8 from "./pages/Ak8";
import Ak9 from "./pages/Ak9";
import NotFound from "./pages/NotFound";
import SheetConfig from "./components/SheetConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ak6" element={<Ak6 />} />
          <Route path="/ak7" element={<Ak7 />} />
          <Route path="/ak8" element={<Ak8 />} />
          <Route path="/ak9" element={<Ak9 />} />
          {/* Fångar upp alla felaktiga adresser */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SheetConfig />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
