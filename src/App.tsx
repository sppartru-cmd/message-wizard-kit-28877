import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Send from "./pages/Send";
import Profiles from "./pages/Profiles";
import CreateProfile from "./pages/CreateProfile";
import MassSend from "./pages/MassSend";
import Analytics from "./pages/Analytics";
import CheckNumbers from "./pages/CheckNumbers";
import NotFound from "./pages/NotFound";
import AccessKey from "./pages/AccessKey";

const queryClient = new QueryClient();

const App = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const activated = localStorage.getItem("app_activated");
    setHasAccess(activated === "true");
    setChecking(false);
  }, []);

  const handleAccessGranted = () => {
    setHasAccess(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AccessKey onAccessGranted={handleAccessGranted} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Send />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/create-profile" element={<CreateProfile />} />
              <Route path="/mass-send" element={<MassSend />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/check-numbers" element={<CheckNumbers />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
