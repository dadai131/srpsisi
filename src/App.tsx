import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Watch from "./pages/Watch";
import Calendar from "./pages/Calendar";
import LiveTV from "./pages/LiveTV";
import NotFound from "./pages/NotFound";
import WallpaperHome from "./pages/WallpaperHome";

const queryClient = new QueryClient();

const isLovableDomain = 
  window.location.hostname.includes('lovable.app') || 
  window.location.hostname.includes('lovable.dev') ||
  window.location.hostname.includes('lovableproject.com');

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {isLovableDomain ? (
          <Routes>
            <Route path="*" element={<WallpaperHome />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/watch/:type/:id" element={<Watch />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/tv" element={<LiveTV />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;