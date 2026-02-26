import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2, Shield } from 'lucide-react';

interface RequireAdminProps {
  children: React.ReactNode;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to admin login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Logged in but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground max-w-md">
            Você não tem permissão para acessar o painel administrativo.
            Entre em contato com o administrador do sistema.
          </p>
          <a 
            href="/" 
            className="mt-4 text-primary hover:underline"
          >
            Voltar para a página inicial
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
