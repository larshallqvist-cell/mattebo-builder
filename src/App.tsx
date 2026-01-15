import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import Ak6 from "./pages/Ak6";
import Ak7 from "./pages/Ak7";
import Ak8 from "./pages/Ak8";
import Ak9 from "./pages/Ak9";
import NotFound from "./pages/NotFound";
import SheetConfig from "./components/SheetConfig";
import ChalkDust from "./components/ChalkDust";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/ak6" element={<Ak6 />} />
        <Route path="/ak7" element={<Ak7 />} />
        <Route path="/ak8" element={<Ak8 />} />
        <Route path="/ak9" element={<Ak9 />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ChalkDust />
      <BrowserRouter>
        <AnimatedRoutes />
        <SheetConfig />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
