
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import TabBar from "./components/TabBar";
import AuthPage from "./pages/Auth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import React from "react";

const queryClient = new QueryClient();

const AppShell = () => (
  <div className="w-full min-h-screen bg-gradient-pink flex flex-col">
    <div className="flex-1 w-full">
      <Outlet />
    </div>
    <TabBar />
  </div>
);

// Protect routes based on authentication
const ProtectedRoutes = () => {
  const { user, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-pink-700 font-bold text-lg animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <AppShell />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/auth"
              element={<AuthPage />}
            />
            <Route
              path="/"
              element={<ProtectedRoutes />}
            >
              <Route index element={<Index />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
