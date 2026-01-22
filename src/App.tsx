import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AlertsProvider } from "@/context/AlertsContext";
import { LoginPage } from "./pages/LoginPage";

const queryClient = new QueryClient();

// Componente para proteger rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex bg-background h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !user.email) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AlertsProvider>
            <BrowserRouter>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Ruta de Login - Si ya está logueado, redirige a / */}
                <Route path="/login" element={
                  <AuthConsumer>
                    {({ user }) => (user && user.email) ? <Navigate to="/" replace /> : <LoginPage />}
                  </AuthConsumer>
                } />

                {/* Ruta Principal - Protegida */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />

                {/* Manejo de errores 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AlertsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

// Helper para consumir auth sin hook en rutas (opcional)
const AuthConsumer = ({ children }: { children: (props: any) => React.ReactNode }) => {
  const auth = useAuth();
  return <>{children(auth)}</>;
};

export default App;
